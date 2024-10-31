from hashlib import sha256

__all__ = ('gravatar_like_hash',)


def gravatar_like_hash(email):
    return sha256(email.lower().encode('utf-8')).hexdigest()
