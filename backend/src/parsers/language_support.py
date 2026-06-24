import tree_sitter_python as tspython
import tree_sitter_javascript as tsjavascript
import tree_sitter_typescript as tstypescript
import tree_sitter_java as tsjava
import tree_sitter_kotlin as tskotlin
import tree_sitter_c as tsc
import tree_sitter_cpp as tscpp
import tree_sitter_c_sharp as tscsharp
import tree_sitter_go as tsgo
import tree_sitter_rust as tsrust
import tree_sitter_php as tsphp
import tree_sitter_ruby as tsruby
import tree_sitter_html as tshtml
import tree_sitter_css as tscss
from tree_sitter import Language

LANGUAGES = {
    "python": Language(tspython.language()),
    "javascript": Language(tsjavascript.language()),
    "typescript": Language(tstypescript.language_typescript()),
    "java": Language(tsjava.language()),
    "kotlin": Language(tskotlin.language()),
    "c": Language(tsc.language()),
    "cpp": Language(tscpp.language()),
    "c_sharp": Language(tscsharp.language()),
    "go": Language(tsgo.language()),
    "rust": Language(tsrust.language()),
    "php": Language(tsphp.language_php()),
    "ruby": Language(tsruby.language()),
    "html": Language(tshtml.language()),
    "css": Language(tscss.language()),
}

EXTENSION_MAP = {
    ".py": "python",
    ".js": "javascript",
    ".jsx": "javascript",
    ".ts": "typescript",
    ".tsx": "typescript",
    ".java": "java",
    ".kt": "kotlin",
    ".c": "c",
    ".h": "c",
    ".cpp": "cpp",
    ".hpp": "cpp",
    ".cs": "c_sharp",
    ".go": "go",
    ".rs": "rust",
    ".php": "php",
    ".rb": "ruby",
    ".html": "html",
    ".htm": "html",
    ".css": "css",
}

def get_language_from_extension(ext: str) -> str | None:
    return EXTENSION_MAP.get(ext)
