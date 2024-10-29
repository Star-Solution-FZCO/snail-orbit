import asyncio
from uuid import UUID

import beanie.operators as bo
import easyocr
import redis.asyncio as aioredis
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

import pm.models._audit as _db_audit

_db_audit._DB_AUDIT = False  # pylint: disable=protected-access

# pylint: disable=wrong-import-position
from pm.config import CONFIG
from pm.models import Issue, IssueAttachment, __beanie_models__
from pm.ocr.config import OCR_CONFIG
from pm.services.files import get_storage_client
from pm.utils.events_bus import Task, TaskType
from pm.utils.file_storage.utils import PseudoAsyncWriteBuffer

IMAGE_TYPES = {'image/jpeg', 'image/png', 'image/bmp'}


async def init_db() -> None:
    client = AsyncIOMotorClient(CONFIG.DB_URI)
    db = client.get_default_database()
    await init_beanie(db, document_models=__beanie_models__)


async def get_file_text(file_id: str, reader: easyocr.Reader) -> str | None:
    client = get_storage_client()
    file_header = await client.get_file_info(file_id)
    if file_header.content_type not in IMAGE_TYPES:
        return None
    buffer = PseudoAsyncWriteBuffer()
    await client.download_file(file_id, buffer)
    res = reader.readtext(buffer.buffer.getvalue())
    return ' '.join([text for _, text, __ in res])


async def _run() -> None:
    await init_db()
    redis_client: aioredis.Redis = aioredis.from_url(CONFIG.REDIS_EVENT_BUS_URL)
    ocr_reader = easyocr.Reader(
        ['en', 'ru'],
        gpu=OCR_CONFIG.OCR_USE_GPU,
        model_storage_directory=OCR_CONFIG.OCR_MODELS_DIR,
        user_network_directory=OCR_CONFIG.OCR_MODELS_DIR,
    )
    while msg_ := await redis_client.blpop(TaskType.OCR.queue_name()):
        try:
            task = Task.from_bus_msg(msg_[1])
            attachment_id = UUID(task.data['attachment_id'])
            issues = await Issue.find(
                bo.Or(
                    Issue.attachments.id == attachment_id,
                    Issue.comments.attachments.id == attachment_id,
                )
            ).to_list()
            if not issues:
                continue
            text = await get_file_text(str(attachment_id), ocr_reader)
            if not text:
                continue
            for issue in issues:
                attachment = get_attachment_obj(issue, attachment_id)
                if not attachment:
                    continue
                attachment.ocr_text = text
                await issue.save_changes()
        except Exception as e:
            print(f'Error: {e}')


def get_attachment_obj(issue: Issue, attachment_id: UUID) -> IssueAttachment | None:
    for attachment in issue.attachments:
        if attachment.id == attachment_id:
            return attachment
    for comment in issue.comments:
        for attachment in comment.attachments:
            if attachment.id == attachment_id:
                return attachment
    return None


def run():
    asyncio.run(_run())
