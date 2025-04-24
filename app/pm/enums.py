from enum import StrEnum

__all__ = (
    'EncryptionKeyAlgorithmT',
    'EncryptionTargetTypeT',
)


class EncryptionKeyAlgorithmT(StrEnum):
    RSA = 'RSA'
    ED25519 = 'ED25519'
    X25519 = 'X25519'


class EncryptionTargetTypeT(StrEnum):
    USER = 'user'
    PROJECT = 'project'
    GLOBAL = 'global'
