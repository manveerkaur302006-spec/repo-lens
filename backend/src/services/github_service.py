import os
from pathlib import Path
from git import Repo
from src.config import settings
from src.core.exceptions import RepositoryCloneError
from src.parsers.language_support import get_language_from_extension

class GithubService:
    def validate_github_url(self, url: str) -> str:
        if not url.startswith("https://github.com/"):
            raise ValueError("Invalid GitHub URL")
        return url

    def clone_repository(self, url: str, job_id: str) -> Path:
        clone_path = Path(settings.CLONE_DIR) / str(job_id)
        if clone_path.exists():
            return clone_path
        
        try:
            Repo.clone_from(url, clone_path, depth=1)
            return clone_path
        except Exception as e:
            raise RepositoryCloneError(f"Failed to clone repository: {e}")

    def scan_files(self, repo_path: Path) -> list[dict]:
        ignored_dirs = {"node_modules", ".git", "build", "dist", "venv", "__pycache__", ".next", ".nuxt", "__tests__"}
        files = []
        for root, dirs, filenames in os.walk(repo_path):
            dirs[:] = [d for d in dirs if d not in ignored_dirs]
            for filename in filenames:
                ext = os.path.splitext(filename)[1]
                language = get_language_from_extension(ext)
                if language:
                    file_path = Path(root) / filename
                    rel_path = file_path.relative_to(repo_path)
                    try:
                        loc = len(file_path.read_text(encoding="utf-8").splitlines())
                        files.append({
                            "path": str(rel_path),
                            "language": language,
                            "loc": loc,
                            "size_bytes": file_path.stat().st_size,
                            "absolute_path": file_path
                        })
                    except Exception:
                        pass
        return files

github_service = GithubService()
