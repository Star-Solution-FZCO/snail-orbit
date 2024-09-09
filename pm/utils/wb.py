from collections.abc import AsyncIterator, Collection, Iterable
from dataclasses import dataclass
from datetime import datetime
from hashlib import sha1
from http import HTTPMethod
from typing import Any, Self
from urllib.parse import quote, urlencode, urljoin

import aiohttp
import jwt

__all__ = ('WbAPIClient',)


MAX_LIMIT_SIZE = 50
SAFE_CHARS = '/:,@'


@dataclass
class WbUser:
    id: int
    email: str
    english_name: str
    active: bool

    @classmethod
    def from_json(cls, data: dict[str, Any]) -> Self:
        return cls(
            id=data['id'],
            email=data['email'],
            english_name=data['english_name'],
            active=data['active'],
        )


async def http_request(
    url: str,
    params: Iterable[tuple[str, str]] | None = None,
    method: HTTPMethod = HTTPMethod.GET,
    data: dict[str, Any] | None = None,
    headers: dict[str, str] | None = None,
    json: bool = True,
) -> Any:
    headers = headers or {}
    if json:
        headers['Content-Type'] = 'application/json'
        headers['Accept'] = 'application/json'
    else:
        headers['Content-Type'] = 'application/x-www-form-urlencoded'
    data = data or {}
    data_kwargs = {}
    if json:
        data_kwargs['json'] = data
    else:
        data_kwargs['data'] = urlencode(data).encode()
    if params:
        splitter = '&' if '?' in url else '?'
        url += splitter + '&'.join(f'{k}={quote(v)}' for k, v in params)
    async with aiohttp.ClientSession(headers=headers) as session:
        async with session.request(method, url, **data_kwargs) as resp:
            if json:
                return await resp.json()
            return await resp.read()


class WbAPIClient:
    __token: str | tuple[str, str]
    _base_url: str

    def __init__(
        self,
        base_url: str,
        token: str | tuple[str, str],
    ) -> None:
        self._base_url = base_url
        self.__token = token

    @property
    def base_url(self) -> str:
        return self._base_url

    def __gen_auth_headers(self, related_url: str, method: str) -> dict[str, str]:
        if isinstance(self.__token, str):
            return {'Authorization': f'Bearer {self.__token}'}
        kid, secret = self.__token
        now = datetime.now().timestamp()
        data = {
            'iat': now - 10,
            'exp': now + 60,
            'req_hash': sha1((method + related_url).encode('utf-8')).hexdigest(),
        }
        token = jwt.encode(
            data,
            secret,
            algorithm='HS256',
            headers={'kid': kid},
        )
        return {'Authorization': f'Bearer {token}'}

    async def _request(
        self,
        endpoint: str,
        params: Iterable[tuple[str, str]] | None = None,
        method: HTTPMethod = HTTPMethod.GET,
        data: dict | None = None,
    ) -> Any:
        related_url = endpoint
        if params:
            related_url += '?' + '&'.join(
                f'{k}={quote(v, safe=SAFE_CHARS)}' for k, v in params
            )
        result = await http_request(
            urljoin(self._base_url, endpoint),
            params=params,
            method=method,
            data=data,
            headers=self.__gen_auth_headers(related_url, method),
            json=True,
        )
        if not isinstance(result, dict):
            raise ValueError(f'Expected dict, got {type(result)}')
        if 'payload' not in result:
            raise ValueError(f'Expected payload in response from wb, got {result}')
        return result['payload']

    async def get_objects(
        self,
        endpoint: str,
        params: Collection[tuple[str, str]] | None = None,
        load_per_request: int = MAX_LIMIT_SIZE,
    ) -> AsyncIterator[Any]:
        if load_per_request > MAX_LIMIT_SIZE:
            load_per_request = MAX_LIMIT_SIZE
        step = 0
        params = params or []
        while True:
            resp = await self._request(
                endpoint,
                params=[
                    *params,
                    ('offset', str(step * load_per_request)),
                    ('limit', str(load_per_request)),
                ],
                method=HTTPMethod.GET,
            )
            if not resp:
                return
            for res in resp['items']:
                yield res
            if resp['count'] <= (step + 1) * load_per_request:
                return
            step += 1

    def get_people(
        self,
        query: str | None = None,
    ) -> AsyncIterator[WbUser]:
        params = []
        if query:
            params.append(('filter', query))

        async def _iter_people() -> AsyncIterator[WbUser]:
            async for person in self.get_objects(
                '/api/v1/employee/list', params=params
            ):
                yield WbUser.from_json(person)

        return _iter_people()

    async def get_person(self, email: str) -> WbUser | None:
        async for person in self.get_people(f'email:"{email}"'):
            return person
        return None
