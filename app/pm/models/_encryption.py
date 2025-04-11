from datetime import datetime
from enum import StrEnum
from typing import Annotated

from beanie import PydanticObjectId
from pydantic import BaseModel, Field

from pm.utils.dateutils import utcnow

__all__ = (
    'EncryptionKeyAlgorithmT',
    'EncryptionTargetTypeT',
    'EncryptionMeta',
    'EncryptionKey',
)


class EncryptionKeyAlgorithmT(StrEnum):
    RSA = 'RSA'
    ED25519 = 'ED25519'
    X25519 = 'X25519'


class EncryptionTargetTypeT(StrEnum):
    USER = 'user'
    PROJECT = 'project'
    GLOBAL = 'global'


class EncryptionMeta(BaseModel):
    fingerprint: str
    target_type: EncryptionTargetTypeT
    target_id: PydanticObjectId | None
    algorithm: EncryptionKeyAlgorithmT
    extras: Annotated[dict, Field(default_factory=dict)]
    data: str


class EncryptionKey(BaseModel):
    name: str
    public_key: str
    fingerprint: str
    algorithm: EncryptionKeyAlgorithmT
    is_active: bool = True
    created_on: str | None = None
    created_at: Annotated[datetime, Field(default_factory=utcnow)]
