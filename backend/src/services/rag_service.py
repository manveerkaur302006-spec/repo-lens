from openai import OpenAI
from typing import Dict, Any
from src.config import settings
from src.services.embedding_service import embedding_service
import logging

logger = logging.getLogger(__name__)

# OpenRouter is OpenAI-API-compatible; point the base_url at their endpoint.
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

class RagService:
    def __init__(self):
        if settings.OPENROUTER_API_KEY:
            self.client = OpenAI(
                api_key=settings.OPENROUTER_API_KEY,
                base_url=OPENROUTER_BASE_URL,
            )
        else:
            self.client = None

    def answer_question(self, job_id: str, question: str) -> Dict[str, Any]:
        if not self.client:
            return {
                "answer": "Set OPENROUTER_API_KEY to enable Q&A.",
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

        system_prompt = (
            "You are an expert AI software architect. "
            "Answer the user's question about the codebase using ONLY the provided code snippets. "
            "Base your answer strictly on the snippets provided. "
            "If the answer cannot be found in the snippets, respond EXACTLY with: "
            "\"I could not find sufficient evidence in the repository.\" "
            "Always explicitly mention the source file paths and function/class names in your explanation."
        )

        user_message = f"Code Context:\n{context}\n\nQuestion: {question}"

        try:
            response = self.client.chat.completions.create(
                model=settings.OPENROUTER_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message},
                ],
            )
            answer = response.choices[0].message.content or ""
            return {
                "answer": answer,
                "sources": list(sources)
            }
        except Exception as e:
            logger.exception(f"Failed to answer question via RAG (OpenRouter): {e}")
            return {
                "answer": "An error occurred while generating the answer from the AI.",
                "sources": []
            }

rag_service = RagService()
