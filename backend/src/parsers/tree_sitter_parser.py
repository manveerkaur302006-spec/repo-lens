from tree_sitter import Parser, Node, Query, QueryCursor
from pathlib import Path
from dataclasses import dataclass
from typing import List, Optional
from src.parsers.language_support import LANGUAGES

@dataclass
class ParsedCall:
    function_name: str
    start_line: int

@dataclass
class ParsedFunction:
    name: str
    start_line: int
    end_line: int
    body: str
    calls: List[ParsedCall]

@dataclass
class ParsedClass:
    name: str
    start_line: int
    end_line: int
    methods: List[ParsedFunction]

@dataclass
class ParsedImport:
    module: str
    names: List[str]

@dataclass
class ParsedFile:
    path: str
    language: str
    functions: List[ParsedFunction]
    classes: List[ParsedClass]
    imports: List[ParsedImport]
    raw_content: str

class TreeSitterParser:
    def __init__(self):
        self.parsers = {}
        for lang_name, lang_obj in LANGUAGES.items():
            parser = Parser(lang_obj)
            self.parsers[lang_name] = parser

    def parse_file(self, path: Path, language: str) -> Optional[ParsedFile]:
        if language not in self.parsers:
            return None
        try:
            content = path.read_text(encoding='utf-8')
            tree = self.parsers[language].parse(bytes(content, 'utf8'))
            
            imports = self._extract_imports(tree.root_node, content, language)
            classes = self._extract_classes(tree.root_node, content, language)
            functions = self._extract_functions(tree.root_node, content, language)
            
            return ParsedFile(
                path=str(path),
                language=language,
                functions=functions,
                classes=classes,
                imports=imports,
                raw_content=content
            )
        except Exception:
            return None

    def _extract_functions(self, root: Node, content: str, language: str) -> List[ParsedFunction]:
        functions = []
        query_str = {
            "python": "(function_definition name: (identifier) @name) @func",
            "javascript": "(function_declaration name: (identifier) @name) @func",
            "typescript": "(function_declaration name: (identifier) @name) @func",
            "java": "(method_declaration name: (identifier) @name) @func",
            "kotlin": "(function_declaration name: (simple_identifier) @name) @func",
            "c": "(function_definition declarator: (function_declarator declarator: (identifier) @name)) @func",
            "cpp": "(function_definition declarator: (function_declarator declarator: (identifier) @name)) @func",
            "c_sharp": "(method_declaration name: (identifier) @name) @func",
            "go": "(function_declaration name: (identifier) @name) @func\n(method_declaration name: (field_identifier) @name) @func",
            "rust": "(function_item name: (identifier) @name) @func",
            "php": "(function_definition name: (name) @name) @func\n(method_declaration name: (name) @name) @func",
            "ruby": "(method name: (identifier) @name) @func",
        }.get(language)
        
        if not query_str:
            return functions
            
        try:
            query = Query(LANGUAGES[language], query_str)
            cursor = QueryCursor(query)
            matches = cursor.matches(root)
            
            for pattern_idx, match_dict in matches:
                func_nodes = match_dict.get("func", [])
                name_nodes = match_dict.get("name", [])
                
                if func_nodes and name_nodes:
                    node = func_nodes[0]
                    name_node = name_nodes[0]
                    func_name = content[name_node.start_byte:name_node.end_byte]
                    
                    # Very basic call extraction within this function
                    calls = []
                    try:
                        call_query_str = {
                            "python": "(call function: (identifier) @call)",
                            "javascript": "(call_expression function: (identifier) @call)",
                            "typescript": "(call_expression function: (identifier) @call)",
                            "java": "(method_invocation name: (identifier) @call)",
                            "kotlin": "(call_expression (simple_identifier) @call)",
                            "c": "(call_expression function: (identifier) @call)",
                            "cpp": "(call_expression function: (identifier) @call)",
                            "c_sharp": "(invocation_expression expression: (identifier) @call)",
                            "go": "(call_expression function: (identifier) @call)",
                            "rust": "(call_expression function: (identifier) @call)",
                            "php": "(function_call_expression function: (name) @call)",
                            "ruby": "(call method: (identifier) @call)",
                        }.get(language)
                        if call_query_str:
                            call_query = Query(LANGUAGES[language], call_query_str)
                            call_cursor = QueryCursor(call_query)
                            for _, c_match in call_cursor.matches(node):
                                c_nodes = c_match.get("call", [])
                                if c_nodes:
                                    c_node = c_nodes[0]
                                    c_name = content[c_node.start_byte:c_node.end_byte]
                                    calls.append(ParsedCall(function_name=c_name, start_line=c_node.start_point.row + 1))
                    except Exception:
                        pass
                        
                    functions.append(ParsedFunction(
                        name=func_name,
                        start_line=node.start_point.row + 1,
                        end_line=node.end_point.row + 1,
                        body=content[node.start_byte:node.end_byte],
                        calls=calls
                    ))
        except Exception as e:
            pass
        return functions

    def _extract_classes(self, root: Node, content: str, language: str) -> List[ParsedClass]:
        classes = []
        query_str = {
            "python": "(class_definition name: (identifier) @name) @class",
            "javascript": "(class_declaration name: (identifier) @name) @class",
            "typescript": "(class_declaration name: (identifier) @name) @class",
            "java": "(class_declaration name: (identifier) @name) @class",
            "kotlin": "(class_declaration name: (simple_identifier) @name) @class",
            "c": "(struct_specifier name: (type_identifier) @name) @class",
            "cpp": "(class_specifier name: (type_identifier) @name) @class\n(struct_specifier name: (type_identifier) @name) @class",
            "c_sharp": "(class_declaration name: (identifier) @name) @class",
            "go": "(type_declaration (type_spec name: (type_identifier) @name type: (struct_type))) @class",
            "rust": "(struct_item name: (type_identifier) @name) @class",
            "php": "(class_declaration name: (name) @name) @class",
            "ruby": "(class name: (constant) @name) @class",
            "html": "(element (start_tag (tag_name) @name)) @class",
            "css": "(rule_set (selectors) @name) @class",
        }.get(language)
        
        if not query_str:
            return classes
            
        try:
            query = Query(LANGUAGES[language], query_str)
            cursor = QueryCursor(query)
            matches = cursor.matches(root)
            
            for pattern_idx, match_dict in matches:
                cls_nodes = match_dict.get("class", [])
                name_nodes = match_dict.get("name", [])
                
                if cls_nodes and name_nodes:
                    node = cls_nodes[0]
                    name_node = name_nodes[0]
                    cls_name = content[name_node.start_byte:name_node.end_byte]
                    
                    # Extract methods within class
                    methods = self._extract_functions(node, content, language)
                    
                    classes.append(ParsedClass(
                        name=cls_name,
                        start_line=node.start_point.row + 1,
                        end_line=node.end_point.row + 1,
                        methods=methods
                    ))
        except Exception:
            pass
        return classes

    def _extract_imports(self, root: Node, content: str, language: str) -> List[ParsedImport]:
        imports = []
        query_str = {
            "python": "(import_from_statement module_name: (dotted_name) @module) @imp\n(import_statement name: (dotted_name) @module) @imp",
            "javascript": "(import_statement source: (string) @module) @imp",
            "typescript": "(import_statement source: (string) @module) @imp",
            "java": "(import_declaration (scoped_identifier) @module) @imp",
            "kotlin": "(import_header (identifier) @module) @imp",
            "c": "(preproc_include path: (string_literal) @module) @imp\n(preproc_include path: (system_lib_string) @module) @imp",
            "cpp": "(preproc_include path: (string_literal) @module) @imp\n(preproc_include path: (system_lib_string) @module) @imp",
            "c_sharp": "(using_directive (identifier) @module) @imp",
            "go": "(import_spec path: (interpreted_string_literal) @module) @imp",
            "rust": "(use_declaration argument: (scoped_identifier) @module) @imp",
            "php": "(namespace_use_clause (name) @module) @imp",
            "ruby": "(call method: (identifier) @method parameters: (argument_list (string) @module) (#match? @method \"^(require|require_relative|load)$\")) @imp",
            "html": "(element (start_tag (tag_name) @method (#match? @method \"^link$\")) (attribute (attribute_name) @attr (#match? @attr \"^href$\") (quoted_attribute_value (attribute_value) @module))) @imp",
            "css": "(import_statement (string_value) @module) @imp",
        }.get(language)
        
        if not query_str:
            return imports
            
        try:
            query = Query(LANGUAGES[language], query_str)
            cursor = QueryCursor(query)
            matches = cursor.matches(root)
            
            for pattern_idx, match_dict in matches:
                mod_nodes = match_dict.get("module", [])
                if mod_nodes:
                    mod_node = mod_nodes[0]
                    mod_name = content[mod_node.start_byte:mod_node.end_byte].strip("'\"")
                    imports.append(ParsedImport(module=mod_name, names=[]))
        except Exception:
            pass
        return imports

tree_sitter_parser = TreeSitterParser()
