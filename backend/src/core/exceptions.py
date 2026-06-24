class RepoLensException(Exception):
    pass

class RepositoryCloneError(RepoLensException):
    pass

class ParsingError(RepoLensException):
    pass

class LLMError(RepoLensException):
    pass
