import asyncio
from hashlib import sha1
from http import HTTPStatus
from os.path import join as opj
from typing import TYPE_CHECKING

import aiofiles
import aiofiles.os as aio_os
import aiohttp

import pm.models as m
from pm.config import CONFIG
from pm.constants import AVATAR_SIZES
from pm.utils.image import (
    bytes_to_image,
    generate_initials_image,
    image_to_bytes,
    resize_image,
)

if TYPE_CHECKING:
    from PIL.Image import Image

__all__ = ('get_avatar_path',)


AVATAR_STORAGE_DIR = opj(CONFIG.FILE_STORAGE_DIR, 'avatars')
ALLOWED_RESPONSE_TYPES = ('image/', 'binary/')


def _file_path(avatar_id: str, size: int) -> str:
    return opj(AVATAR_STORAGE_DIR, f'{avatar_id}_{size}.png')


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
            return bytes_to_image(data)
        except Exception:
            pass
    user = await m.User.find_one(m.User.email == email)
    if not user:
        return None
    return generate_initials_image(
        user.name, max(AVATAR_SIZES), background_color_bytes=bytes.fromhex(avatar_id)
    )


async def _clear_avatar_cache(avatar_id: str) -> None:
    async def _remove_file(file_path: str) -> None:
        try:
            await aio_os.remove(file_path)
        except FileNotFoundError:
            pass

    await asyncio.gather(
        *[_remove_file(_file_path(avatar_id, s)) for s in AVATAR_SIZES]
    )


async def get_avatar_path(email: str, size: int, update: bool = False) -> str | None:
    if size not in AVATAR_SIZES:
        raise ValueError('Invalid size')
    avatar_id = avatar_hash(email)
    file_path = _file_path(avatar_id, size)
    if await aio_os.path.exists(file_path):
        if not update:
            return file_path
        await _clear_avatar_cache(avatar_id)
    img = await _get_new_avatar_img(email, avatar_id)
    if not img:
        return None
    images = {s: resize_image(img, s) for s in AVATAR_SIZES}
    for s, img in images.items():
        img_bytes = image_to_bytes(img)
        img_path = _file_path(avatar_id, s)
        await aio_os.makedirs(AVATAR_STORAGE_DIR, exist_ok=True)
        async with aiofiles.open(img_path, 'wb') as f:
            await f.write(img_bytes.read())

    return file_path
