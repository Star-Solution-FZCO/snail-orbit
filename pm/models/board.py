from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field

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
    issues_order: list[PydanticObjectId] = Field(default_factory=list)

    def move_issue(
        self, issue_id: PydanticObjectId, after_id: PydanticObjectId | None = None
    ) -> None:
        try:
            self.issues_order.remove(issue_id)
        except ValueError:
            pass
        new_idx = 0
        if after_id:
            try:
                new_idx = self.issues_order.index(after_id) + 1
            except ValueError:
                self.issues_order.append(after_id)
                self.issues_order.append(issue_id)
                return
        self.issues_order.insert(new_idx, issue_id)
