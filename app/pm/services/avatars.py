from functools import cache
from hashlib import sha256

import pm.models as m
from pm.config import CONFIG
from pm.services.files import get_storage_client
from pm.utils.file_storage import FileHeader
from pm.utils.file_storage.utils import PseudoAsyncReadBuffer
from pm.utils.image import (
    generate_initials_image,
    image_to_bytes,
)

__all__ = (
    'AVATAR_STORAGE_DIR',
    'PROJECT_AVATAR_STORAGE_DIR',
    'external_avatar_url',
    'generate_default_avatar',
    'local_avatar_url',
)


AVATAR_STORAGE_DIR = 'avatars'
AVATAR_FORMAT = 'png'
AVATAR_SIZE = 200
PROJECT_AVATAR_STORAGE_DIR = 'avatars/projects'


def avatar_hash(email: str) -> str:
    """
    Generate gravatar-like hash from email
    """
    return sha256(email.strip().lower().encode()).hexdigest()


@cache
def external_avatar_url(email: str) -> str | None:
    if not CONFIG.AVATAR_EXTERNAL_URL:
        return None
    return CONFIG.AVATAR_EXTERNAL_URL.format(email=email, hash=avatar_hash(email))


@cache
def local_avatar_url(email: str) -> str:
    return f'/api/avatar/{avatar_hash(email)}'


async def generate_default_avatar(user: m.User) -> None:
    email_hash = avatar_hash(user.email)
    img = generate_initials_image(
        user.name,
        AVATAR_SIZE,
        background_color_bytes=bytes.fromhex(email_hash),
    )
    client = get_storage_client()
    data = image_to_bytes(img, format_=AVATAR_FORMAT.upper()).read()
    buffer = PseudoAsyncReadBuffer(data)
    file_header = FileHeader(
        size=len(data),
        name=f'{email_hash}.{AVATAR_FORMAT}',
        content_type=f'image/{AVATAR_FORMAT}',
    )
    await client.upload_file(email_hash, buffer, file_header, folder=AVATAR_STORAGE_DIR)
