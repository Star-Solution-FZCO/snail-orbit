from enum import StrEnum

__all__ = ('EncryptionKeyAlgorithmT',)


class EncryptionKeyAlgorithmT(StrEnum):
    RSA = 'RSA'
    ED25519 = 'ED25519'
