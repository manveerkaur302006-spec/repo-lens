from src.services.analysis_orchestrator import analysis_orchestrator

async def run_analysis_async(job_id: str, repo_url: str):
    await analysis_orchestrator.run_analysis(job_id, repo_url)
