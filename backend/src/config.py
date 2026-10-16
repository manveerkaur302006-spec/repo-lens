from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://repolens:repolens_secret@localhost:5432/repolens"
    NEO4J_URI: str = "bolt://localhost:7687"
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: str = "repolens_neo4j"
    NEO4J_DATABASE: str = ""
    GEMINI_API_KEY: str = ""
    CLONE_DIR: str = "/tmp/repos"
    # Cloud settings are optional: docker-compose uses the local HTTP server.
    CHROMA_API_KEY: str = ""
    CHROMA_TENANT: str = ""
    CHROMA_DATABASE: str = ""
    CHROMA_HOST: str = "localhost"
    CHROMA_PORT: int = 8100

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def use_asyncpg_driver(cls, value: str) -> str:
        """Render supplies a standard Postgres URL; SQLAlchemy async needs asyncpg."""
        if value.startswith("postgres://"):
            return "postgresql+asyncpg://" + value.removeprefix("postgres://")
        if value.startswith("postgresql://"):
            return "postgresql+asyncpg://" + value.removeprefix("postgresql://")
        return value

settings = Settings()
