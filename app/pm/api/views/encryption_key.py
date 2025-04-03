from datetime import datetime
from typing import Self

from beanie import PydanticObjectId
from pydantic import BaseModel

import pm.models as m

__all__ = (
    'EncryptionKeyOut',
    'EncryptionMetaOut',
    'EncryptionKeyCreate',
    'EncryptionKeyUpdate',
)


class EncryptionMetaOut(BaseModel):
    public_key: str
    fingerprint: str
    algorithm: m.EncryptionKeyAlgorithmT
    target_type: m.EncryptionTargetTypeT
    target_id: PydanticObjectId | None

    @classmethod
    def from_obj(cls, obj: m.EncryptionKeyMeta) -> Self:
        return cls(
            public_key=obj.public_key,
            fingerprint=obj.fingerprint,
            algorithm=obj.algorithm,
            target_type=obj.target_type,
            target_id=obj.target_id,
        )


class EncryptionKeyOut(BaseModel):
    name: str
    public_key: str
    fingerprint: str
    algorithm: m.EncryptionKeyAlgorithmT
    is_active: bool
    created_on: str | None
    created_at: datetime

    @classmethod
    def from_obj(cls, obj: m.EncryptionKey) -> Self:
        return cls(
            name=obj.name,
            public_key=obj.public_key,
            fingerprint=obj.fingerprint,
            algorithm=obj.algorithm,
            is_active=obj.is_active,
            created_on=obj.created_on,
            created_at=obj.created_at,
        )


class EncryptionKeyCreate(BaseModel):
    name: str
    public_key: str
    fingerprint: str
    algorithm: m.EncryptionKeyAlgorithmT
    is_active: bool = True
    created_on: str | None = None


class EncryptionKeyUpdate(BaseModel):
    name: str | None = None
    is_active: bool | None = None
