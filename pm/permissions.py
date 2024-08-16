from enum import StrEnum

__all__ = ('Permissions',)


class Permissions(StrEnum):
    PROJECT_READ = 'project:read'
    PROJECT_UPDATE = 'project:update'
    PROJECT_DELETE = 'project:delete'

    ISSUE_CREATE = 'issue:create'
    ISSUE_READ = 'issue:read'
    ISSUE_UPDATE = 'issue:update'
    ISSUE_DELETE = 'issue:delete'

    COMMENT_CREATE = 'comment:create'
    COMMENT_READ = 'comment:read'
    COMMENT_UPDATE = 'comment:update'
    COMMENT_DELETE_OWN = 'comment:delete_own'
    COMMENT_DELETE = 'comment:delete'

    ATTACHMENT_CREATE = 'attachment:create'
    ATTACHMENT_READ = 'attachment:read'
    ATTACHMENT_DELETE_OWN = 'attachment:delete_own'
    ATTACHMENT_DELETE = 'attachment:delete'
