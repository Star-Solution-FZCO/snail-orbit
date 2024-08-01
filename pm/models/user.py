import bcrypt
from beanie import Document, Indexed, PydanticObjectId
from pydantic import BaseModel

from ._audit import audited_model

__all__ = (
    'User',
    'UserLinkField',
)


class UserLinkField(BaseModel):
    id: PydanticObjectId
    name: str
    email: str


@audited_model
class User(Document):
    class Settings:
        name = 'users'
        use_revision = True
        use_state_management = True
        state_management_save_previous = True

    name: str = Indexed(str)
    email: str = Indexed(str, unique=True)
    password_hash: str | None = None
    is_active: bool = True
    is_admin: bool = False

    def check_password(self, password: str) -> bool:
        if not self.password_hash:
            return False
        return bcrypt.checkpw(
            password.encode('utf-8'), self.password_hash.encode('utf-8')
        )

    @staticmethod
    def hash_password(password: str) -> str:
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
