from typing import Iterable, List
from src.database.neo4j_client import neo4j_client
from src.parsers.tree_sitter_parser import ParsedFile
from src.schemas.api_schemas import GraphData, GraphNode, GraphEdge
import logging

logger = logging.getLogger(__name__)

class GraphService:
    @staticmethod
    def _batches(items: List[dict], size: int = 1_000) -> Iterable[List[dict]]:
        """Keep Cypher parameters reasonably sized for very large repositories."""
        for start in range(0, len(items), size):
            yield items[start:start + size]

    async def build_repository_graph(self, job_id: str, repo_name: str, parsed_files: List[ParsedFile]):
        await neo4j_client.connect()
        
        await neo4j_client.execute_query(
            "MATCH (n) WHERE n.job_id = $job_id DETACH DELETE n",
            {"job_id": job_id}
        )

        await neo4j_client.execute_query(
            "MERGE (r:Repository {name: $repo_name, job_id: $job_id})",
            {"repo_name": repo_name, "job_id": job_id}
        )

        # Prepare graph records in memory, then write each relationship type in bulk.
        # The former implementation awaited a query for every node and edge, which
        # made network latency dominate analyses of non-trivial repositories.
        files, classes, methods, functions, calls, imports = [], [], [], [], [], []
        for pf in parsed_files:
            files.append({"path": pf.path})

            for cls in pf.classes:
                classes.append({"file_path": pf.path, "cls_name": cls.name})
                for method in cls.methods:
                    methods.append({"file_path": pf.path, "cls_name": cls.name, "func_name": method.name})
                    calls.extend({"file_path": pf.path, "func_name": method.name, "target_name": call.function_name} for call in method.calls)

            for func in pf.functions:
                functions.append({"file_path": pf.path, "func_name": func.name})
                calls.extend({"file_path": pf.path, "func_name": func.name, "target_name": call.function_name} for call in func.calls)

            imports.extend({"file_path": pf.path, "module_name": imp.module} for imp in pf.imports)

        bulk_operations = [
            (files, """
                MATCH (r:Repository {job_id: $job_id})
                UNWIND $rows AS row
                MERGE (f:File {path: row.path, job_id: $job_id})
                MERGE (r)-[:CONTAINS]->(f)
            """),
            (classes, """
                UNWIND $rows AS row
                MATCH (f:File {path: row.file_path, job_id: $job_id})
                MERGE (c:Class {name: row.cls_name, file_path: row.file_path, job_id: $job_id})
                MERGE (f)-[:HAS_CLASS]->(c)
            """),
            (methods, """
                UNWIND $rows AS row
                MATCH (c:Class {name: row.cls_name, file_path: row.file_path, job_id: $job_id})
                MERGE (m:Function {name: row.func_name, file_path: row.file_path, job_id: $job_id})
                MERGE (c)-[:HAS_METHOD]->(m)
            """),
            (functions, """
                UNWIND $rows AS row
                MATCH (f:File {path: row.file_path, job_id: $job_id})
                MERGE (func:Function {name: row.func_name, file_path: row.file_path, job_id: $job_id})
                MERGE (f)-[:HAS_FUNCTION]->(func)
            """),
            (calls, """
                UNWIND $rows AS row
                MATCH (func:Function {name: row.func_name, file_path: row.file_path, job_id: $job_id})
                MERGE (target:Function {name: row.target_name, job_id: $job_id})
                MERGE (func)-[:CALLS]->(target)
            """),
            (imports, """
                UNWIND $rows AS row
                MATCH (f:File {path: row.file_path, job_id: $job_id})
                MERGE (m:Module {name: row.module_name, job_id: $job_id})
                MERGE (f)-[:IMPORTS]->(m)
            """),
        ]

        for rows, query in bulk_operations:
            for batch in self._batches(rows):
                await neo4j_client.execute_query(query, {"job_id": job_id, "rows": batch})

    async def get_graph_data(self, job_id: str) -> GraphData:
        await neo4j_client.connect()
        
        nodes_result = await neo4j_client.execute_query(
            "MATCH (n) WHERE n.job_id = $job_id RETURN elementId(n) as id, labels(n)[0] as label, n.name as name, n.path as path",
            {"job_id": job_id}
        )
        edges_result = await neo4j_client.execute_query(
            "MATCH (a)-[r]->(b) WHERE a.job_id = $job_id RETURN elementId(a) as source, elementId(b) as target, type(r) as type",
            {"job_id": job_id}
        )

        nodes = [GraphNode(
            id=str(r["id"]), 
            label=r["label"], 
            name=r.get("name") or r.get("path") or "Unknown",
            path=r.get("path")
        ) for r in nodes_result]
        
        edges = [GraphEdge(
            source=str(r["source"]), 
            target=str(r["target"]), 
            type=r["type"]
        ) for r in edges_result]

        return GraphData(nodes=nodes, edges=edges)

    async def get_file_tree(self, job_id: str) -> dict:
        """Build the sidebar tree from indexed file paths without reading a clone."""
        await neo4j_client.connect()
        records = await neo4j_client.execute_query(
            "MATCH (f:File {job_id: $job_id}) RETURN f.path AS path ORDER BY f.path",
            {"job_id": job_id},
        )
        root = {"name": "root", "path": "/", "type": "directory", "children": []}
        for record in records:
            path = record.get("path")
            if not path:
                continue
            current = root
            parts = [part for part in path.replace("\\", "/").split("/") if part]
            for index, part in enumerate(parts):
                is_file = index == len(parts) - 1
                child_path = "/".join(parts[:index + 1])
                child = next((item for item in current["children"] if item["name"] == part), None)
                if child is None:
                    child = {
                        "name": part,
                        "path": child_path,
                        "type": "file" if is_file else "directory",
                        **({"children": []} if not is_file else {}),
                    }
                    current["children"].append(child)
                current = child
        return root

graph_service = GraphService()
