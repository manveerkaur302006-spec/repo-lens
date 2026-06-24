from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from src.database.postgres import get_db
from src.schemas.api_schemas import (
    AnalyzeRequest, AnalyzeResponse, StatusResponse, 
    ReportResponse, QueryRequest, QueryResponse,
    GraphData, FileTreeNode
)
from src.models.sqlalchemy_models import AnalysisJob, Repository
from src.workers.analysis_worker import run_analysis_async
from src.services.github_service import github_service
from src.services.graph_service import graph_service
from src.services.rag_service import rag_service
from sqlalchemy import select
import uuid

router = APIRouter(prefix="/api")

@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_repo(req: AnalyzeRequest, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    try:
        url = github_service.validate_github_url(req.repo_url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    result = await db.execute(select(Repository).where(Repository.url == url))
    repo = result.scalars().first()
    if not repo:
        repo = Repository(url=url, name=url.split('/')[-1])
        db.add(repo)
        await db.commit()

    job_id = str(uuid.uuid4())
    job = AnalysisJob(id=job_id, repo_id=repo.id)
    db.add(job)
    await db.commit()

    background_tasks.add_task(run_analysis_async, job_id, url)
    return AnalyzeResponse(job_id=job_id)

@router.get("/status/{job_id}", response_model=StatusResponse)
async def get_status(job_id: str, db: AsyncSession = Depends(get_db)):
    job = await db.get(AnalysisJob, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return StatusResponse(
        status=job.status,
        progress=job.progress,
        current_step=job.current_step,
        error_message=job.error_message
    )

@router.get("/report/{job_id}", response_model=ReportResponse)
async def get_report(job_id: str, db: AsyncSession = Depends(get_db)):
    job = await db.get(AnalysisJob, job_id)
    if not job or job.status != "completed":
        raise HTTPException(status_code=404, detail="Report not ready or job not found")
    
    return ReportResponse(
        summary=job.summary or {},
        stats=job.stats or {}
    )

@router.post("/query", response_model=QueryResponse)
async def query_repo(req: QueryRequest, db: AsyncSession = Depends(get_db)):
    job = await db.get(AnalysisJob, req.job_id)
    if not job or job.status != "completed":
        raise HTTPException(status_code=400, detail="Repository not fully analyzed yet")
        
    result = rag_service.answer_question(req.job_id, req.question)
    return QueryResponse(answer=result["answer"], sources=result["sources"])

@router.get("/graph/{job_id}", response_model=GraphData)
async def get_graph(job_id: str):
    return await graph_service.get_graph_data(job_id)

@router.get("/files/{job_id}")
async def get_files(job_id: str):
    return {
        "tree": {
            "name": "root",
            "path": "/",
            "type": "dir",
            "children": []
        }
    }

