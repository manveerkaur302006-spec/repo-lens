from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class AnalyzeRequest(BaseModel):
    repo_url: str

class AnalyzeResponse(BaseModel):
    job_id: str

class StatusResponse(BaseModel):
    status: str
    progress: int
    current_step: str
    error_message: Optional[str] = None

class ReportResponse(BaseModel):
    summary: Dict[str, Any]
    stats: Dict[str, Any]

class QueryRequest(BaseModel):
    job_id: str
    question: str

class QueryResponse(BaseModel):
    answer: str
    sources: List[str]

class GraphNode(BaseModel):
    id: str
    label: str
    name: str
    path: Optional[str] = None

class GraphEdge(BaseModel):
    source: str
    target: str
    type: str

class GraphData(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]

class FileTreeNode(BaseModel):
    name: str
    path: str
    type: str
    children: Optional[List['FileTreeNode']] = None
