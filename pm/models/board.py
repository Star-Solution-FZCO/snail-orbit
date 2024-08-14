from beanie import Document, Indexed

from ._audit import audited_model

__all__ = ('Board',)


@audited_model
class Board(Document):
    class Settings:
        name = 'boards'
        use_revision = True
        use_state_management = True
        state_management_save_previous = True

    name: str = Indexed(str)
    description: str | None = None
    query: str | None = None
    column_field: str
    columns: list[str]
