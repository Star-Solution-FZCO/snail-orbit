from typing import Self

from pydantic import BaseModel

import pm.models as m

__all__ = ('ReportLinkOutput',)


class ReportLinkOutput(BaseModel):
    id: str
    name: str
    description: str | None

    @classmethod
    def from_obj(cls, obj: m.Report | m.ReportLinkField) -> Self:
        return cls(
            id=str(obj.id),
            name=obj.name,
            description=obj.description,
        )
