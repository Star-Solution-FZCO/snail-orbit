"""Authentication and user models."""

# Re-export generated models - manual models were redundant duplicates
from ..generated.models import Profile, UserAvatarType, UserOriginType
from ..generated.models import UserOutput as User

__all__ = [
    'User',
    'Profile',
    'UserAvatarType',
    'UserOriginType',
]
