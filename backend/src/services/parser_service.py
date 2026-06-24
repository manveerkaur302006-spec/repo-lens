from typing import List, Dict, Any
import logging
from src.parsers.tree_sitter_parser import tree_sitter_parser, ParsedFile

logger = logging.getLogger(__name__)

class ParserService:
    def parse_repository(self, files: List[Dict[str, Any]]) -> List[ParsedFile]:
        parsed_files = []
        for file_info in files:
            path = file_info["absolute_path"]
            language = file_info["language"]
            parsed = tree_sitter_parser.parse_file(path, language)
            if parsed:
                parsed.path = file_info["path"]
                parsed_files.append(parsed)
                
                # Logging observability per parsed file
                num_classes = len(parsed.classes)
                num_functions = len(parsed.functions)
                num_imports = len(parsed.imports)
                
                # Count total intra-function calls inside methods/functions
                num_calls = 0
                for c in parsed.classes:
                    for m in c.methods:
                        num_calls += len(m.calls)
                for f in parsed.functions:
                    num_calls += len(f.calls)
                    
                logger.info(
                    f"Parsed {file_info['path']} [Lang: {language}] -> "
                    f"Classes: {num_classes}, Functions: {num_functions}, "
                    f"Imports: {num_imports}, Calls: {num_calls}"
                )
                
        return parsed_files

    def aggregate_stats(self, parsed_files: List[ParsedFile]) -> Dict[str, Any]:
        languages = {}
        total_loc = 0
        total_functions = 0
        total_classes = 0
        total_imports = 0

        for pf in parsed_files:
            languages[pf.language] = languages.get(pf.language, 0) + 1
            total_loc += len(pf.raw_content.splitlines())
            total_functions += len(pf.functions)
            total_classes += len(pf.classes)
            total_imports += len(pf.imports)

        return {
            "total_files": len(parsed_files),
            "total_loc": total_loc,
            "total_functions": total_functions,
            "total_classes": total_classes,
            "total_imports": total_imports,
            "languages": languages
        }

parser_service = ParserService()
