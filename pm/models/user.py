import bcrypt

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column

from starsol_sql_base import BaseModel

__all__ = ('User',)


class User(BaseModel):
    __tablename__ = 'users'
    name: Mapped[str]
    email: Mapped[str] = mapped_column(index=True, unique=True)
    password_hash: Mapped[str | None]
    is_active: Mapped[bool] = mapped_column(server_default=sa.true())
    is_admin: Mapped[bool] = mapped_column(server_default=sa.false())

    def check_password(self, password: str) -> bool:
        if not self.password_hash:
            return False
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))

    @staticmethod
    def hash_password(password: str) -> str:
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
