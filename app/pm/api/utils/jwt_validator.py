import time
from collections.abc import Collection
from typing import Literal

import jwt

__all__ = (
    'JWTValidationError',
    'is_jwt',
    'validate_jwt',
)


IAT_DRIFT = 30


class JWTValidationError(Exception):
    msg: str

    def __init__(self, msg: str) -> None:
        self.msg = msg
        super().__init__(msg)


def is_jwt(token: str) -> bool:
    """
    Check if a given token is a JSON Web Token (JWT).

    This function attempts to extract the headers of the token
    using the 'jwt' library. If successful, it checks if the 'typ'
    field in the headers is 'JWT'. If any decoding errors occur during
    this process, the function will catch the error and return False.

    Args:
        token: A string representing the token to be checked.

    Returns:
        bool: True if the token is a valid JWT; otherwise, False.
    """
    try:
        headers = jwt.get_unverified_header(token)
        return headers.get('typ') == 'JWT'
    except jwt.DecodeError:
        return False


def validate_jwt(
    token: str,
    keys: dict[str, str],
    algo: Literal['HS256'] = 'HS256',
    require_sub: bool = True,
    require_exp: bool = True,
    max_age: int | None = None,
    required_additional_claims: Collection[str] | None = None,
) -> tuple[str, dict]:
    """
    Verify a JSON Web Token (JWT) based on specified requirements and return its payload.

    The function verifies the JWT using the provided 'keys' and 'algo'. Depending on the
    parameters, it checks for the presence and validity of 'sub', 'exp', 'iat', and additional
    claims in the token's payload. Raises `JWTValidationError` if any verification step fails.

    Parameters
    ----------
    token : str
        The JWT to be verified.
    keys : dict[str, str]
        A dictionary mapping 'kid' (key ID) to the corresponding secret keys.
    algo : Literal['HS256']
        The algorithm used to sign the token. Default is 'HS256'.
    require_sub : bool
        Whether the 'sub' (subject) claim is required in the token. Default is True.
    require_exp : bool
        Whether the 'exp' (expiration) claim is required in the token. Default is True.
    max_age : int, optional
        The maximum allowed age of the token in seconds. Default is None.
    required_additional_claims : Collection[str], optional
        A collection of additional claims that must be present in the token's payload.
        Default is None.

    Returns
    -------
    tuple[str, dict]
        Returns a tuple where the first element is the 'kid' (key ID) and the second
        element is the decoded payload of the token as a dictionary.

    Raises
    ------
    JWTValidationError
        If the token is invalid, expired, or does not conform to the specified requirements.
    """

    try:
        header = jwt.get_unverified_header(token)
    except jwt.DecodeError as err:
        raise JWTValidationError('Invalid token') from err
    if not (kid := header.get('kid')):
        raise JWTValidationError('kid header is required')
    if not (key := keys.get(kid)):
        raise JWTValidationError('Invalid kid')
    try:
        data = jwt.decode(token, key, algorithms=[algo])
    except jwt.ExpiredSignatureError as err:
        raise JWTValidationError('Token expired') from err
    except jwt.InvalidTokenError as err:
        raise JWTValidationError('Invalid token') from err

    exp = data.get('exp', 0)
    iat = data.get('iat', 0)

    if require_exp and not exp:
        raise JWTValidationError('exp claim is required')

    if max_age:
        if not iat:
            raise JWTValidationError('iat claim is required')
        if not exp:
            raise JWTValidationError('exp claim is required')
        if iat > time.time() + IAT_DRIFT:
            raise JWTValidationError('iat claim is too far in the future')
        if exp - iat > max_age:
            raise JWTValidationError('Token ttl is too long')

    if require_sub and 'sub' not in data:
        raise JWTValidationError('sub claim is required')
    for claim in required_additional_claims or []:
        if claim not in data:
            raise JWTValidationError(f'{claim} claim is required')

    return kid, data
