import logging
from sqlalchemy.ext.asyncio import AsyncSession
from src.models.sqlalchemy_models import AnalysisJob
from src.services.github_service import github_service
from src.services.parser_service import parser_service
from src.services.graph_service import graph_service
from src.services.embedding_service import embedding_service
from src.services.summary_service import summary_service
from src.database.postgres import async_session_maker

logger = logging.getLogger(__name__)

class AnalysisOrchestrator:
    async def update_job(self, job_id: str, status: str, progress: int, current_step: str, db: AsyncSession, **kwargs):
        job = await db.get(AnalysisJob, job_id)
        if job:
            job.status = status
            job.progress = progress
            job.current_step = current_step
            for k, v in kwargs.items():
                setattr(job, k, v)
            await db.commit()

    async def run_analysis(self, job_id: str, repo_url: str):
        async with async_session_maker() as db:
            try:
                await self.update_job(job_id, "cloning", 10, "Cloning repository", db)
                repo_path = github_service.clone_repository(repo_url, job_id)
                repo_name = repo_url.rstrip('/').split('/')[-1]

                await self.update_job(job_id, "parsing", 15, "Scanning files", db)
                scanned_files = github_service.scan_files(repo_path)

                await self.update_job(job_id, "parsing", 40, "Parsing source code", db)
                parsed_files = parser_service.parse_repository(scanned_files)
                stats = parser_service.aggregate_stats(parsed_files)

                await self.update_job(job_id, "graphing", 55, "Building knowledge graph", db)
                await graph_service.build_repository_graph(job_id, repo_name, parsed_files)

                # Core analysis is complete. Now try AI features.
                ai_failed = False
                
                try:
                    await self.update_job(job_id, "embedding", 75, "Generating embeddings", db)
                    chunks = embedding_service.create_chunks(parsed_files)
                    embeddings = embedding_service.generate_embeddings(chunks)
                    embedding_service.store_embeddings(job_id, chunks, embeddings)
                except Exception as e:
                    logger.exception(f"Embedding generation/storage failed for job {job_id}")
                    ai_failed = True

                try:
                    await self.update_job(job_id, "summarizing", 90, "Generating summary", db)
                    summary = summary_service.generate_summary(repo_name, stats, parsed_files)
                except Exception as e:
                    logger.exception(f"Summary generation failed for job {job_id}")
                    ai_failed = True
                    summary = summary_service.get_fallback_summary(repo_name, stats)

                final_status = "partially_completed" if ai_failed else "completed"
                await self.update_job(job_id, final_status, 100, "Analysis complete", db, summary=summary, stats=stats)
                logger.info(f"Analysis {final_status} for job {job_id}")

            except Exception as e:
                logger.exception(f"Core analysis failed for job {job_id}")
                await self.update_job(job_id, "failed", 0, "Failed", db, error_message=str(e))

analysis_orchestrator = AnalysisOrchestrator()
