"""Domain exceptions mapped to HTTP responses in `app.main`."""


class DomainError(Exception):
    """Base class for expected business-rule errors."""

    status_code = 400

    def __init__(self, detail: str) -> None:
        super().__init__(detail)
        self.detail = detail


class NotFoundError(DomainError):
    status_code = 404


class ConflictError(DomainError):
    status_code = 409


class InvalidOperationError(DomainError):
    status_code = 400
