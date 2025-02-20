import secrets
from dataclasses import dataclass
from urllib.parse import quote

import aiohttp
import jwt
from cryptography.x509 import load_pem_x509_certificate

__all__ = (
    'discover_oidc_params',
    'auth_with_oidc_token',
)


@dataclass
class OIDCParams:
    public_keys: list[dict]
    issuer: str
    token_endpoint: str
    authorization_endpoint: str

    def gen_login_url(self, client_id: str, state: str, callback_url: str) -> str:
        query = {
            'response_type': 'code',
            'client_id': client_id,
            'redirect_uri': callback_url,
            'scope': 'openid',
            'state': state,
        }
        query_str = '&'.join(f'{k}={quote(v)}' for k, v in query.items())
        return f'{self.authorization_endpoint}?{query_str}'

    def decode_token(self, token: str, client_id: str) -> dict[str, str]:
        for pub_key in self.public_keys:
            pub_key_pem = f'-----BEGIN CERTIFICATE-----\n{pub_key["x5c"][0]}\n-----END CERTIFICATE-----'.encode()
            cert = load_pem_x509_certificate(pub_key_pem)
            try:
                return jwt.decode(
                    token, cert.public_key(), algorithms=['RS256'], audience=client_id
                )
            except jwt.PyJWTError:
                pass
        raise ValueError('Token decoding failed')


async def discover_oidc_params(discovery_url: str) -> OIDCParams:
    async with aiohttp.ClientSession() as session:
        async with session.get(discovery_url, ssl=False) as response:
            data = await response.json()
    async with aiohttp.ClientSession() as session:
        async with session.get(data['jwks_uri'], ssl=False) as response:
            public_keys = (await response.json())['keys']
    return OIDCParams(
        public_keys=public_keys,
        issuer=data['issuer'],
        token_endpoint=data['token_endpoint'],
        authorization_endpoint=data['authorization_endpoint'],
    )


async def auth_with_oidc_token(
    code: str,
    client_id: str,
    client_secret: str,
    discovery_url: str,
    callback_url: str,
) -> str | None:
    params = await discover_oidc_params(discovery_url)
    nonce = secrets.token_urlsafe(32)
    url = f'{params.token_endpoint}?response_type=id_token&nonce={nonce}'
    async with aiohttp.ClientSession() as session:
        async with session.post(
            url,
            data={
                'grant_type': 'authorization_code',
                'scope': 'openid',
                'code': code,
                'client_id': client_id,
                'client_secret': client_secret,
                'redirect_uri': callback_url,
            },
            ssl=False,
        ) as response:
            id_token = (await response.json())['id_token']
    try:
        data = params.decode_token(id_token, client_id)
    except ValueError:
        return None
    return data['sub']
