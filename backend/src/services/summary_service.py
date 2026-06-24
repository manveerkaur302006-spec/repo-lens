from google import genai
from typing import Dict, Any, List
from src.config import settings
from src.parsers.tree_sitter_parser import ParsedFile
import json
import logging

logger = logging.getLogger(__name__)

class SummaryService:
    def __init__(self):
        if settings.GEMINI_API_KEY:
            self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        else:
            self.client = None

    def get_fallback_summary(self, repo_name: str, stats: Dict[str, Any]) -> Dict[str, Any]:
        """Metadata-based fallback summary when AI fails."""
        total_files = stats.get('total_files', 0)
        total_loc = stats.get('total_loc', 0)
        languages = list(stats.get('languages', {}).keys())
        
        return {
            "purpose": f"Repository '{repo_name}' is a software project comprising {total_files} files and {total_loc} lines of code.",
            "tech_stack": languages,
            "architecture": "Architecture details unavailable due to AI failure. Rely on the generated graph for structural insights.",
            "strengths": [
                "Successfully parsed core repository structure",
                "Knowledge graph available for exploration"
            ],
            "weaknesses": [
                "AI summary generation failed or quota exhausted"
            ]
        }

    def generate_summary(self, repo_name: str, stats: Dict[str, Any], parsed_files: List[ParsedFile]) -> Dict[str, Any]:
        # if not self.client:
        #     logger.warning("No Gemini API key provided. Using fallback summary.")
        #     return self.get_fallback_summary(repo_name, stats)

        # # Get top files by LOC and top classes/functions
        # sorted_files = sorted(parsed_files, key=lambda x: len(x.raw_content.splitlines()), reverse=True)[:10]
        # top_files = [f"{pf.path} ({pf.language})" for pf in sorted_files]
        
        # prompt = f"""
        # Analyze the repository '{repo_name}' based on the following metadata.
        
        # Stats:
        # - Total Files: {stats.get('total_files')}
        # - Total Lines of Code: {stats.get('total_loc')}
        # - Languages: {json.dumps(stats.get('languages'))}
        
        # Top 10 Files:
        # {json.dumps(top_files)}
        
        # Provide a JSON response with the following keys:
        # - purpose (string): A short paragraph describing what this repository does.
        # - tech_stack (list of strings): Main languages, frameworks, or tools used.
        # - architecture (string): A paragraph explaining how the codebase is structured.
        # - strengths (list of strings): 2-3 strong points about the codebase.
        # - weaknesses (list of strings): 1-2 potential areas of improvement.
        
        # Respond ONLY with valid JSON.
        # """

        # try:
        #     # Using gemini-2.5-flash for faster, cheaper summaries
        #     response = self.client.models.generate_content(
        #         model='gemini-2.5-flash',
        #         contents=prompt,
        #         config=genai.types.GenerateContentConfig(
        #             response_mime_type="application/json",
        #         ),
        #     )
        #     return json.loads(response.text)
        # except Exception as e:
        #     logger.exception(f"Failed to generate summary via Gemini: {e}")
        #     raise e
        logger.warning(
        "Summary generation disabled. Using fallback summary.")

        return self.get_fallback_summary(
        repo_name=repo_name,
        stats=stats
        )

summary_service = SummaryService()
