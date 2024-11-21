from typing import Annotated

from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field

from ._audit import audited_model
from .custom_fields import CustomField, CustomFieldLink, CustomFieldValueT
from .project import ProjectLinkField

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
    projects: Annotated[list[ProjectLinkField], Field(default_factory=list)]
    column_field: CustomFieldLink
    columns: Annotated[list[CustomFieldValueT], Field(default_factory=list)]
    swimlane_field: CustomFieldLink | None = None
    swimlanes: Annotated[list[CustomFieldValueT], Field(default_factory=list)]
    issues_order: Annotated[list[PydanticObjectId], Field(default_factory=list)]
    card_fields: Annotated[list[CustomFieldLink], Field(default_factory=list)]
    card_colors_fields: Annotated[list[CustomFieldLink], Field(default_factory=list)]
    ui_settings: dict = Field(default_factory=dict)

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

    @classmethod
    async def update_field_embedded_links(
        cls, field: CustomField | CustomFieldLink
    ) -> None:
        if isinstance(field, CustomField):
            field = CustomFieldLink.from_obj(field)
        await cls.find(cls.column_field.id == field.id).update(
            {'$set': {'column_field': field}}
        )
        await cls.find(cls.swimlane_field.id == field.id).update(
            {'$set': {'swimlane_field': field}}
        )
        await cls.find(cls.card_fields.id == field.id).update(
            {'$set': {'card_fields.$[f]': field}},
            array_filters=[{'f.id': field.id}],
        )
        await cls.find(cls.card_colors_fields.id == field.id).update(
            {'$set': {'card_colors_fields.$[f]': field}},
            array_filters=[{'f.id': field.id}],
        )
