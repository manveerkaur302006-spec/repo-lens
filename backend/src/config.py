from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://repolens:repolens_secret@localhost:5432/repolens"
    NEO4J_URI: str = "bolt://localhost:7687"
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: str = "repolens_neo4j"
    GEMINI_API_KEY: str = ""
    CLONE_DIR: str = "/tmp/repos"
    CHROMA_API_KEY: str
    CHROMA_TENANT: str
    CHROMA_DATABASE: str

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
