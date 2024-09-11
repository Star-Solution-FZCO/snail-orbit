from hashlib import sha1
from http import HTTPStatus
from os.path import join as opj
from typing import TYPE_CHECKING

import aiofiles
import aiofiles.os as aio_os
import aiohttp

import pm.models as m
from pm.config import CONFIG
from pm.constants import AVATAR_SIZE
from pm.utils.image import (
    bytes_to_image,
    generate_initials_image,
    image_to_bytes,
    resize_image,
)

if TYPE_CHECKING:
    from PIL.Image import Image

__all__ = (
    'get_avatar_path',
    'clean_avatar_cache',
)


AVATAR_STORAGE_DIR = opj(CONFIG.FILE_STORAGE_DIR, 'avatars')
ALLOWED_RESPONSE_TYPES = ('image/', 'binary/')


def _file_path(avatar_id: str) -> str:
    return opj(AVATAR_STORAGE_DIR, f'{avatar_id}.png')


def avatar_hash(email: str) -> str:
    return sha1(email.encode()).hexdigest()


async def get_avatar_from_external_service(email: str) -> bytes | None:
    if not CONFIG.AVATAR_EXTERNAL_URL:
        return None
    url = CONFIG.AVATAR_EXTERNAL_URL.format(email=email)
    async with aiohttp.ClientSession() as session:
        async with session.get(url, allow_redirects=True) as response:
            if response.status != HTTPStatus.OK:
                return None
            if all(
                not response.content_type.startswith(t) for t in ALLOWED_RESPONSE_TYPES
            ):
                return None
            return await response.read()


async def _get_new_avatar_img(email: str, avatar_id: str) -> 'Image | None':
    data = await get_avatar_from_external_service(email)
    if data:
        try:
            return resize_image(bytes_to_image(data), AVATAR_SIZE)
        except Exception:
            pass
    user = await m.User.find_one(m.User.email == email)
    if not user:
        return None
    return generate_initials_image(
        user.name, AVATAR_SIZE, background_color_bytes=bytes.fromhex(avatar_id)
    )


async def _clear_avatar_cache(avatar_id: str) -> None:
    try:
        await aio_os.remove(_file_path(avatar_id))
    except FileNotFoundError:
        pass


async def get_avatar_path(email: str, update: bool = False) -> str | None:
    avatar_id = avatar_hash(email)
    file_path = _file_path(avatar_id)
    if await aio_os.path.exists(file_path):
        if not update:
            return file_path
        await _clear_avatar_cache(avatar_id)
    img = await _get_new_avatar_img(email, avatar_id)
    img_path = _file_path(avatar_id)
    await aio_os.makedirs(AVATAR_STORAGE_DIR, exist_ok=True)
    async with aiofiles.open(img_path, 'wb') as f:
        await f.write(image_to_bytes(img).read())

    return file_path


async def clean_avatar_cache(email: str) -> None:
    await _clear_avatar_cache(avatar_hash(email))
