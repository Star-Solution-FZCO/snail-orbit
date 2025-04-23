from datetime import datetime
from http import HTTPStatus

from fastapi import HTTPException

import pm.models as m
from pm.api.views.issue import IssueAttachmentBody
from pm.services.files import resolve_files
from pm.utils.dateutils import utcnow

__all__ = ('update_attachments',)


async def update_attachments(
    obj: m.Issue | m.IssueDraft | m.IssueComment,
    attachments: list[IssueAttachmentBody | m.IssueAttachment] | None,
    user: m.User,
    now: datetime | None = None,
) -> None:
    if not attachments:
        obj.attachments = []
        return
    now = now or utcnow()
    attachments_by_id = {a.id: a for a in attachments}
    try:
        extra_attachments = await resolve_files(
            attachments_by_id.keys() - set(a.id for a in obj.attachments)
        )
    except ValueError as err:
        raise HTTPException(HTTPStatus.BAD_REQUEST, str(err)) from err

    results = []

    for attachment in obj.attachments:
        if attachment.id not in attachments_by_id:
            continue
        attachment.encryption = attachments_by_id[attachment.id].encryption
        results.append(attachment)

    for a_id, a_data in extra_attachments.items():
        results.append(
            m.IssueAttachment(
                id=a_id,
                name=a_data.name,
                size=a_data.size,
                content_type=a_data.content_type,
                author=m.UserLinkField.from_obj(user),
                created_at=now,
                encryption=attachments_by_id[a_id].encryption,
            )
        )

    obj.attachments = results
