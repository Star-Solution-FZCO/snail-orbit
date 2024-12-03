from pydantic import BaseModel

__all__ = (
    'ValidateModelException',
    'MFARequiredException',
)


class ValidateModelException(Exception):
    def __init__(
        self,
        payload: BaseModel,
        error_messages: list[str],
        error_fields: dict[str, str],
    ):
        super().__init__()
        self.payload = payload
        self.error_messages = error_messages
        self.error_fields = error_fields


class MFARequiredException(Exception):
    pass
