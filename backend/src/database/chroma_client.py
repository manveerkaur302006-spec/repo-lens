import chromadb
from src.config import settings
import logging

logger = logging.getLogger(__name__)

class ChromaClient:
    def __init__(self):
        self.client = None

    def connect(self):
        if not self.client:
            try:
                # Switched from HttpClient to CloudClient
                self.client = chromadb.CloudClient(
                    api_key=settings.CHROMA_API_KEY,
                    tenant=settings.CHROMA_TENANT,
                    database=settings.CHROMA_DATABASE
                )
                logger.info("Connected to ChromaDB Cloud")
            except Exception as e:
                logger.exception(f"Failed to connect to ChromaDB Cloud: {e}")
                self.client = None

    def get_or_create_collection(self, job_id: str):
        if not self.client:
            self.connect()
            if not self.client:
                return None
        
        # Note: Chroma collections usually need to be unique per tenant/database
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