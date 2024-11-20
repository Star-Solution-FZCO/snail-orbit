import pm.models as m

__all__ = ('update_tags_on_close_resolve',)


async def update_tags_on_close_resolve(
    issue: m.Issue,
) -> None:
    if not issue.is_resolved and not issue.is_closed:
        return
    tag_objs = {t.id: await t.resolve() for t in issue.tags}
    if issue.is_resolved:
        issue.tags = [
            tag for tag in issue.tags if not tag_objs[tag.id].untag_on_resolve
        ]
    if issue.is_closed:
        issue.tags = [tag for tag in issue.tags if not tag_objs[tag.id].untag_on_close]
