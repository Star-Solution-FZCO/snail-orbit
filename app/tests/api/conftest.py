import asyncio
import os

import mock
import pytest
import pytest_asyncio
from beanie import init_beanie
from fastapi.testclient import TestClient
from motor.motor_asyncio import AsyncIOMotorClient

from tests.utils.aiofiles_fake import aio_fs

if dns_servers := os.getenv('DNS_SERVERS'):
    import dns.resolver

    dns.resolver.default_resolver = dns.resolver.Resolver(configure=False)
    dns.resolver.default_resolver.nameservers = dns_servers.split(',')


@pytest.fixture(autouse=True)
def fs_session():
    yield from aio_fs()


@pytest_asyncio.fixture(autouse=True)
async def init_db():
    import pm.models as m
    from pm.config import CONFIG

    client = AsyncIOMotorClient(
        CONFIG.DB_URI,
    )
    client.get_io_loop = asyncio.get_event_loop
    db = client.get_default_database()
    await init_beanie(db, document_models=m.__beanie_models__)
    yield
    await client.drop_database(db)


@pytest.fixture(scope='session')
def test_client():
    with (
        mock.patch('pm.services.avatars.generate_default_avatar', mock.AsyncMock()),
        mock.patch('pm.templates.render_template', mock.Mock()),
    ):
        from pm.api.app import app

        yield TestClient(app)
