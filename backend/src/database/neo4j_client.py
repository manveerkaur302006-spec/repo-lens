from neo4j import AsyncGraphDatabase, AsyncDriver
from src.config import settings
import logging

logger = logging.getLogger(__name__)

class Neo4jClient:
    def __init__(self):
        self.driver: AsyncDriver | None = None

    async def connect(self):
        if not self.driver:
            self.driver = AsyncGraphDatabase.driver(
                settings.NEO4J_URI,
                auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD)
            )
            logger.info("Connected to Neo4j")

    async def close(self):
        if self.driver:
            await self.driver.close()
            self.driver = None

    async def execute_query(self, query: str, parameters: dict = None):
        if not self.driver:
            await self.connect()
        parameters = parameters or {}
        async with self.driver.session() as session:
            result = await session.run(query, parameters)
            return [record.data() async for record in result]

neo4j_client = Neo4jClient()
