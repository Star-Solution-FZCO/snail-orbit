import asyncio
from os.path import join as opj
from uuid import UUID

import aiofiles
import easyocr
import redis.asyncio as aioredis
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

from pm.api.utils.files import FileHeader, dir_by_id
from pm.config import CONFIG
from pm.models import Issue, __beanie_models__
from pm.ocr.config import OCR_CONFIG

IMAGE_TYPES = {'image/jpeg', 'image/png', 'image/bmp'}


async def init_db() -> None:
    client = AsyncIOMotorClient(CONFIG.DB_URI)
    db = client.get_default_database()
    await init_beanie(db, document_models=__beanie_models__)


async def read_file(file_id: str) -> tuple[str, bytes | None]:
    async with aiofiles.open(opj(dir_by_id(file_id), file_id), 'rb') as file:
        header = await FileHeader.read(file)
        if header.content_type not in IMAGE_TYPES:
            return '', None
        return await file.read()


async def get_file_text(file_id: str, reader: easyocr.Reader) -> str | None:
    async with aiofiles.open(opj(dir_by_id(file_id), file_id), 'rb') as file:
        header = await FileHeader.read(file)
        if header.content_type not in IMAGE_TYPES:
            return None
        content = await file.read()
    if not content:
        return None
    res = reader.readtext(content)
    return ' '.join([text for _, text, __ in res])


async def _run() -> None:
    await init_db()
    redis_client = aioredis.from_url(CONFIG.REDIS_EVENT_BUS_URL).pubsub()
    await redis_client.subscribe('ocr')
    ocr_reader = easyocr.Reader(
        ['en', 'ru'],
        gpu=OCR_CONFIG.OCR_USE_GPU,
        model_storage_directory=OCR_CONFIG.OCR_MODELS_DIR,
        user_network_directory=OCR_CONFIG.OCR_MODELS_DIR,
    )
    try:
        async for msg in redis_client.listen():
            if msg['type'] != 'message':
                continue
            file_id = msg['data'].decode()
            attachment_id = UUID(file_id)
            try:
                issue = await Issue.find_one(Issue.attachments.id == attachment_id)
                if not issue:
                    continue
                attachment = next(a for a in issue.attachments if a.id == file_id)
                if attachment.ocr_text:
                    continue
                text = await get_file_text(file_id, ocr_reader)
                if not text:
                    continue
                attachment.ocr_text = text
                await issue.save_changes()
            except Exception as e:
                print(f'Error: {e}')
    finally:
        await redis_client.unsubscribe('ocr')
        await redis_client.close()


def run():
    asyncio.run(_run())
