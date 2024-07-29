import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column

from starsol_sql_base import BaseModel

__all__ = ('Project',)


class Project(BaseModel):
    __tablename__ = 'projects'
    name: Mapped[str]
    description: Mapped[str | None]
    is_active: Mapped[bool] = mapped_column(server_default=sa.true())
