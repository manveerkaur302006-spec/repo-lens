from openai import OpenAI
from typing import Dict, Any, List
from src.config import settings
from src.parsers.tree_sitter_parser import ParsedFile
import json
import logging

logger = logging.getLogger(__name__)

# OpenRouter is OpenAI-API-compatible; point the base_url at their endpoint.
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

class SummaryService:
    def __init__(self):
        if settings.OPENROUTER_API_KEY:
            self.client = OpenAI(
                api_key=settings.OPENROUTER_API_KEY,
                base_url=OPENROUTER_BASE_URL,
            )
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
        if not self.client:
            logger.warning("No OPENROUTER_API_KEY provided. Using fallback summary.")
            return self.get_fallback_summary(repo_name, stats)

        # Get top files by LOC for context
        sorted_files = sorted(parsed_files, key=lambda x: len(x.raw_content.splitlines()), reverse=True)[:10]
        top_files = [f"{pf.path} ({pf.language})" for pf in sorted_files]

        system_prompt = (
            "You are an expert software architect. "
            "Analyze the provided repository metadata and return a JSON object with exactly these keys: "
            "purpose (string), tech_stack (list of strings), architecture (string), "
            "strengths (list of strings, 2-3 items), weaknesses (list of strings, 1-2 items). "
            "Respond ONLY with valid JSON — no markdown fences, no extra text."
        )

        user_message = (
            f"Repository: {repo_name}\n\n"
            f"Stats:\n"
            f"- Total Files: {stats.get('total_files')}\n"
            f"- Total Lines of Code: {stats.get('total_loc')}\n"
            f"- Languages: {json.dumps(stats.get('languages'))}\n\n"
            f"Top 10 Files by LOC:\n{json.dumps(top_files)}"
        )

        try:
            response = self.client.chat.completions.create(
                model=settings.OPENROUTER_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message},
                ],
            )
            raw = response.choices[0].message.content or ""
            # Strip accidental markdown fences if the model adds them
            raw = raw.strip()
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
                raw = raw.rstrip("`").strip()
            return json.loads(raw)
        except json.JSONDecodeError as e:
            logger.exception(f"OpenRouter summary returned invalid JSON for {repo_name}: {e}")
            return self.get_fallback_summary(repo_name, stats)
        except Exception as e:
            logger.exception(f"Failed to generate summary via OpenRouter for {repo_name}: {e}")
            return self.get_fallback_summary(repo_name, stats)

summary_service = SummaryService()
