import chromadb
from chromadb.config import Settings
from src.config import settings
import logging

logger = logging.getLogger(__name__)

class ChromaClient:
    def __init__(self):
        self.client = None

    def connect(self):
        if not self.client:
            try:
                self.client = chromadb.HttpClient(
                    host=settings.CHROMA_HOST,
                    port=settings.CHROMA_PORT,
                    settings=Settings(anonymized_telemetry=False)
                )
                logger.info("Connected to ChromaDB")
            except Exception as e:
                logger.exception(f"Failed to connect to ChromaDB: {e}")
                self.client = None

    def get_or_create_collection(self, job_id: str):
        if not self.client:
            self.connect()
            if not self.client:
                return None
        collection_name = f"repo_{job_id.replace('-', '_')}"
        try:
            return self.client.get_or_create_collection(
                name=collection_name,
                metadata={"hnsw:space": "cosine"}
            )
        except Exception as e:
            logger.exception(f"Failed to get/create Chroma collection: {e}")
            return None

chroma_client = ChromaClient()
