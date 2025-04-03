from datetime import datetime
from enum import StrEnum
from typing import Annotated

from beanie import PydanticObjectId
from pydantic import BaseModel, Field

from pm.utils.dateutils import utcnow

__all__ = (
    'EncryptionKeyAlgorithmT',
    'EncryptionTargetTypeT',
    'EncryptionKeyMeta',
    'EncryptionKey',
)


class EncryptionKeyAlgorithmT(StrEnum):
    RSA = 'RSA'
    ED25519 = 'ED25519'


class EncryptionTargetTypeT(StrEnum):
    USER = 'user'
    PROJECT = 'project'
    GLOBAL = 'global'


class EncryptionKeyMeta(BaseModel):
    fingerprint: str
    target_type: EncryptionTargetTypeT
    target_id: PydanticObjectId | None
    public_key: str
    algorithm: EncryptionKeyAlgorithmT


class EncryptionKey(BaseModel):
    name: str
    public_key: str
    fingerprint: str
    algorithm: EncryptionKeyAlgorithmT
    is_active: bool = True
    created_on: str | None = None
    created_at: Annotated[datetime, Field(default_factory=utcnow)]
