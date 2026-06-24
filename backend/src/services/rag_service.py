from google import genai
from typing import Dict, Any
from src.config import settings
from src.services.embedding_service import embedding_service
import logging

logger = logging.getLogger(__name__)

class RagService:
    def __init__(self):
        if settings.GEMINI_API_KEY:
            self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        else:
            self.client = None

    def answer_question(self, job_id: str, question: str) -> Dict[str, Any]:
        if not self.client:
            return {
                "answer": "Set GEMINI_API_KEY to enable Q&A.",
                "sources": []
            }
        
        # Limit to 10 chunks max
        chunks = embedding_service.search_similar(job_id, question, top_k=10)
        
        if not chunks:
            return {
                "answer": "I could not find sufficient evidence in the repository (Chroma index may be empty or failed).",
                "sources": []
            }

        context = ""
        sources = set()
        for i, chunk in enumerate(chunks):
            meta = chunk["metadata"]
            file_path = meta.get("file_path", "unknown")
            entity = meta.get("entity_name", "unknown")
            start = meta.get("start_line", "?")
            end = meta.get("end_line", "?")
            sources.add(file_path)
            
            context += f"\n--- Snippet {i+1} from {file_path} (Entity: {entity}, lines {start}-{end}) ---\n"
            context += chunk["content"] + "\n"

        prompt = f"""
        You are an expert AI software architect. Answer the user's question about the codebase using ONLY the provided code snippets.
        
        Code Context:
        {context}
        
        Question: {question}
        
        Guidelines:
        1. Base your answer strictly on the snippets provided.
        2. If the answer cannot be found in the snippets, respond EXACTLY with: "I could not find sufficient evidence in the repository."
        3. Always explicitly mention the source file paths and function/class names in your explanation.
        """

        try:
            response = self.client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt
            )
            return {
                "answer": response.text,
                "sources": list(sources)
            }
        except Exception as e:
            logger.exception(f"Failed to answer question via RAG: {e}")
            return {
                "answer": "An error occurred while generating the answer from the AI.",
                "sources": []
            }

rag_service = RagService()
