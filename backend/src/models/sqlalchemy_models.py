from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from src.database.postgres import Base

class Repository(Base):
    __tablename__ = "repositories"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    url = Column(String, unique=True, index=True)
    name = Column(String)
    owner = Column(String)
    default_branch = Column(String, default="main")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String, default="active")
    
    jobs = relationship("AnalysisJob", back_populates="repository", cascade="all, delete-orphan")

class AnalysisJob(Base):
    __tablename__ = "analysis_jobs"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    repo_id = Column(UUID(as_uuid=True), ForeignKey("repositories.id"), nullable=True)
    status = Column(String, default="pending") 
    progress = Column(Integer, default=0)
    current_step = Column(String, default="Initializing")
    error_message = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    summary = Column(JSON, nullable=True)
    stats = Column(JSON, nullable=True)
    
    repository = relationship("Repository", back_populates="jobs")
    files = relationship("File", back_populates="job", cascade="all, delete-orphan")
    chunks = relationship("Chunk", back_populates="job", cascade="all, delete-orphan")

class File(Base):
    __tablename__ = "files"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(UUID(as_uuid=True), ForeignKey("analysis_jobs.id"))
    path = Column(String, index=True)
    language = Column(String)
    loc = Column(Integer, default=0)
    size_bytes = Column(Integer, default=0)

    job = relationship("AnalysisJob", back_populates="files")

class Chunk(Base):
    __tablename__ = "chunks"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(UUID(as_uuid=True), ForeignKey("analysis_jobs.id"))
    file_path = Column(String)
    chunk_type = Column(String)
    entity_name = Column(String, nullable=True)
    start_line = Column(Integer)
    end_line = Column(Integer)
    content = Column(String)

    job = relationship("AnalysisJob", back_populates="chunks")
