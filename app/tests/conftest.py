import os
import secrets

import pytest

TEST_CONFIG = {
    'DEV_MODE': True,
    'DEBUG': True,
    'JWT_SECRET': secrets.token_hex(32),
    'DEV_PASSWORD': secrets.token_hex(32),
}
ENV_PREFIX = 'SNAIL_ORBIT'


@pytest.fixture(autouse=True, scope='session')
def set_env():
    for k, v in TEST_CONFIG.items():
        os.environ[f'{ENV_PREFIX}_{k}'] = str(v)
    yield
    for k in TEST_CONFIG:
        os.unsetenv(f'{ENV_PREFIX}_{k}')
