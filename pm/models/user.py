import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column

from starsol_sql_base import BaseModel

__all__ = ('User',)


class User(BaseModel):
    __tablename__ = 'users'
    name: Mapped[str]
    email: Mapped[str] = mapped_column(index=True, unique=True)
    active: Mapped[bool] = mapped_column(server_default=sa.true())
