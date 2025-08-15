from ._audit import *
from ._encryption import *
from .board import *
from .custom_fields import *
from .custom_fields import rebuild_models as cf_rebuild_models
from .dashboard import *
from .global_role import *
from .group import *
from .group import rebuild_models as group_rebuild_models
from .issue import *
from .permission import *
from .project import *
from .report import *
from .role import *
from .search import *
from .tag import *
from .user import *
from .workflow import *

cf_rebuild_models()
group_rebuild_models()

__beanie_models__ = [
    AuditRecord,
    Group,
    LocalGroup,
    WBGroup,
    AllUsersGroup,
    SystemAdminsGroup,
    User,
    Project,
    Issue,
    IssueDraft,
    Board,
    Dashboard,
    ProjectRole,
    GlobalRole,
    Report,
    CustomField,
    StringCustomField,
    IntegerCustomField,
    FloatCustomField,
    BooleanCustomField,
    DateCustomField,
    DateTimeCustomField,
    UserCustomField,
    UserMultiCustomField,
    EnumCustomField,
    EnumMultiCustomField,
    StateCustomField,
    VersionCustomField,
    VersionMultiCustomField,
    OwnedCustomField,
    OwnedMultiCustomField,
    Workflow,
    ScheduledWorkflow,
    OnChangeWorkflow,
    Tag,
    Search,
]
