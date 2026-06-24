from typing import List, Dict, Any
from google import genai
from src.config import settings
from src.database.chroma_client import chroma_client
from src.parsers.tree_sitter_parser import ParsedFile
import uuid
import logging

logger = logging.getLogger(__name__)

class EmbeddingService:
    def __init__(self):
        if settings.GEMINI_API_KEY:
            self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        else:
            self.client = None

    def create_chunks(self, parsed_files: List[ParsedFile]) -> List[Dict[str, Any]]:
        chunks = []
        for pf in parsed_files:
            for func in pf.functions:
                chunks.append({
                    "id": str(uuid.uuid4()),
                    "file_path": pf.path,
                    "language": pf.language,
                    "chunk_type": "function",
                    "entity_name": func.name,
                    "start_line": func.start_line,
                    "end_line": func.end_line,
                    "content": func.body
                })
            
            if not pf.functions and not pf.classes and len(pf.raw_content.splitlines()) < 200:
                chunks.append({
                    "id": str(uuid.uuid4()),
                    "file_path": pf.path,
                    "language": pf.language,
                    "chunk_type": "file",
                    "entity_name": "file_overview",
                    "start_line": 1,
                    "end_line": len(pf.raw_content.splitlines()),
                    "content": pf.raw_content
                })
        return chunks

    def generate_embeddings(self, chunks: List[Dict[str, Any]]) -> List[List[float]]:
        if not self.client:
            logger.warning("No GEMINI_API_KEY. Using mock embeddings.")
            return [[0.0] * 768 for _ in chunks]

        embeddings = []
        for chunk in chunks:
            try:
                response = self.client.models.embed_content(
                    model='gemini-embedding-2',
                    contents=chunk["content"],
                )
                embeddings.append(response.embeddings[0].values)
            except Exception as e:
                logger.error(f"Embedding failed: {e}")
                embeddings.append([0.0] * 768)
        return embeddings

    def store_embeddings(self, job_id: str, chunks: List[Dict[str, Any]], embeddings: List[List[float]]):
        if not chunks:
            return
        collection = chroma_client.get_or_create_collection(job_id)
        if not collection:
            logger.error(f"Cannot store embeddings for {job_id}; Chroma collection is None.")
            return
        
        ids = [c["id"] for c in chunks]
        documents = [c["content"] for c in chunks]
        metadatas = [{
            "file_path": c["file_path"],
            "language": c["language"],
            "chunk_type": c["chunk_type"],
            "entity_name": c["entity_name"],
            "start_line": c["start_line"],
            "end_line": c["end_line"]
        } for c in chunks]

        try:
            collection.upsert(
                ids=ids,
                documents=documents,
                embeddings=embeddings,
                metadatas=metadatas
            )
        except Exception as e:
            logger.exception(f"Failed to upsert embeddings into ChromaDB for job {job_id}: {e}")

    def search_similar(self, job_id: str, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        collection = chroma_client.get_or_create_collection(job_id)
        if not collection:
            logger.error(f"Cannot search embeddings for {job_id}; Chroma collection is None.")
            return []
        
        if self.client:
            query_embedding = self.client.models.embed_content(
                model='gemini-embedding-2',
                contents=query,
            ).embeddings[0].values
        else:
            query_embedding = [0.0] * 768

        try:
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k
            )

            chunks = []
            if results and results["documents"]:
                for i in range(len(results["documents"][0])):
                    chunks.append({
                        "id": results["ids"][0][i],
                        "content": results["documents"][0][i],
                        "metadata": results["metadatas"][0][i],
                        "distance": results["distances"][0][i] if "distances" in results else 0
                    })
            return chunks
        except Exception as e:
            logger.exception(f"Failed to query ChromaDB for job {job_id}: {e}")
            return []

embedding_service = EmbeddingService()
