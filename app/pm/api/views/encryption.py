from datetime import datetime
from typing import Self

from beanie import PydanticObjectId
from pydantic import BaseModel

import pm.models as m
from pm.enums import EncryptionKeyAlgorithmT, EncryptionTargetTypeT

__all__ = (
    'EncryptionKeyOut',
    'EncryptionKeyPublicOut',
    'EncryptionKeyCreate',
    'EncryptionKeyUpdate',
)


class EncryptionKeyPublicOut(BaseModel):
    fingerprint: str
    target_type: EncryptionTargetTypeT
    target_id: PydanticObjectId | None
    public_key: str
    algorithm: EncryptionKeyAlgorithmT

    @classmethod
    def from_obj(
        cls,
        obj: m.EncryptionKey,
        target_type: EncryptionTargetTypeT,
        target_id: PydanticObjectId | None = None,
    ) -> Self:
        return cls(
            fingerprint=obj.fingerprint,
            target_type=target_type,
            target_id=target_id,
            public_key=obj.public_key,
            algorithm=obj.algorithm,
        )


class EncryptionKeyOut(BaseModel):
    name: str
    public_key: str
    fingerprint: str
    algorithm: EncryptionKeyAlgorithmT
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
    algorithm: EncryptionKeyAlgorithmT
    is_active: bool = True
    created_on: str | None = None


class EncryptionKeyUpdate(BaseModel):
    name: str | None = None
    is_active: bool | None = None
