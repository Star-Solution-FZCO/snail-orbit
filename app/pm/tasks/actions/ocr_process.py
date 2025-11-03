import logging
from uuid import UUID

from beanie import PydanticObjectId

import pm.models as m
from pm.config import CONFIG
from pm.tasks._base import setup_database
from pm.tasks.app import broker
from pm.utils.ocr_client import OCRClient

__all__ = ('process_attachments_ocr',)

logger = logging.getLogger(__name__)


def get_attachment_obj(
    issue: m.Issue, attachment_id: UUID, comment_id: UUID | None = None
) -> m.IssueAttachment | None:
    if not comment_id:
        for attachment in issue.attachments:
            if attachment.id == attachment_id:
                return attachment
        return None
    for comment in issue.comments:
        if comment.id != comment_id:
            continue
        for attachment in comment.attachments:
            if attachment.id == attachment_id:
                return attachment
    return None


@broker.task(retry_count=3, retry_delay=30)
async def process_attachments_ocr(
    attachment_ids: list[str], issue_id: str, comment_id: str | None = None
) -> None:
    if not CONFIG.OCR.ENABLE:
        return
    if not attachment_ids:
        return

    await setup_database()
    attachment_uuids = [UUID(a_id) for a_id in attachment_ids]
    comment_uuid = UUID(comment_id) if comment_id else None

    issue: m.Issue | None = await m.Issue.find_one(
        m.Issue.id == PydanticObjectId(issue_id),
    )

    if not issue:
        return

    async with OCRClient(
        servers=CONFIG.OCR.NATS_SERVERS,
        queue=CONFIG.OCR.NATS_QUEUE,
        results_bucket=CONFIG.OCR.NATS_RESULTS_BUCKET,
    ) as ocr_client:
        for attachment_id in attachment_uuids:
            attachment = get_attachment_obj(
                issue, attachment_id, comment_id=comment_uuid
            )
            if not attachment or attachment.encryption:
                continue
            file_path = f'storage/{attachment_id}'
            ocr_text = await ocr_client.process_image(file_path)
            logger.debug('Processed attachment %s: %s', attachment_id, ocr_text)
            if not ocr_text:
                continue
            attachment.ocr_text = ocr_text
    await issue.save_changes()
