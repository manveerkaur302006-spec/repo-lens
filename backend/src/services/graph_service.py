from typing import List
from src.database.neo4j_client import neo4j_client
from src.parsers.tree_sitter_parser import ParsedFile
from src.schemas.api_schemas import GraphData, GraphNode, GraphEdge
import logging

logger = logging.getLogger(__name__)

class GraphService:
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

        for pf in parsed_files:
            await neo4j_client.execute_query(
                """
                MATCH (r:Repository {job_id: $job_id})
                MERGE (f:File {path: $path, job_id: $job_id})
                MERGE (r)-[:CONTAINS]->(f)
                """,
                {"job_id": job_id, "path": pf.path}
            )

            for cls in pf.classes:
                await neo4j_client.execute_query(
                    """
                    MATCH (f:File {path: $file_path, job_id: $job_id})
                    MERGE (c:Class {name: $cls_name, file_path: $file_path, job_id: $job_id})
                    MERGE (f)-[:HAS_CLASS]->(c)
                    """,
                    {"job_id": job_id, "file_path": pf.path, "cls_name": cls.name}
                )
                
                for method in cls.methods:
                    await neo4j_client.execute_query(
                        """
                        MATCH (c:Class {name: $cls_name, file_path: $file_path, job_id: $job_id})
                        MERGE (m:Function {name: $func_name, file_path: $file_path, job_id: $job_id})
                        MERGE (c)-[:HAS_METHOD]->(m)
                        """,
                        {"cls_name": cls.name, "file_path": pf.path, "job_id": job_id, "func_name": method.name}
                    )

                    for call in method.calls:
                        await neo4j_client.execute_query(
                            """
                            MATCH (m:Function {name: $func_name, file_path: $file_path, job_id: $job_id})
                            MERGE (target:Function {name: $target_name, job_id: $job_id})
                            MERGE (m)-[:CALLS]->(target)
                            """,
                            {"func_name": method.name, "file_path": pf.path, "job_id": job_id, "target_name": call.function_name}
                        )

            for func in pf.functions:
                await neo4j_client.execute_query(
                    """
                    MATCH (f:File {path: $file_path, job_id: $job_id})
                    MERGE (func:Function {name: $func_name, file_path: $file_path, job_id: $job_id})
                    MERGE (f)-[:HAS_FUNCTION]->(func)
                    """,
                    {"file_path": pf.path, "job_id": job_id, "func_name": func.name}
                )

                for call in func.calls:
                    await neo4j_client.execute_query(
                        """
                        MATCH (func:Function {name: $func_name, file_path: $file_path, job_id: $job_id})
                        MERGE (target:Function {name: $target_name, job_id: $job_id})
                        MERGE (func)-[:CALLS]->(target)
                        """,
                        {"func_name": func.name, "file_path": pf.path, "job_id": job_id, "target_name": call.function_name}
                    )
            
            for imp in pf.imports:
                await neo4j_client.execute_query(
                    """
                    MATCH (f:File {path: $file_path, job_id: $job_id})
                    MERGE (m:Module {name: $module_name, job_id: $job_id})
                    MERGE (f)-[:IMPORTS]->(m)
                    """,
                    {"file_path": pf.path, "job_id": job_id, "module_name": imp.module}
                )

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

graph_service = GraphService()
