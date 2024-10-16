from ._audit import *
from .board import *
from .custom_fields import *
from .group import *
from .issue import *
from .project import *
from .role import *
from .user import *
from .workflow import *

__beanie_models__ = [
    AuditRecord,
    Group,
    User,
    Project,
    Issue,
    IssueDraft,
    Board,
    Role,
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
    Workflow,
    ScheduledWorkflow,
    OnChangeWorkflow,
]
