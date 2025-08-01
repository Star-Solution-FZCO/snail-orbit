# pylint: disable=wrong-import-position, import-outside-toplevel, ungrouped-imports, wrong-import-order
# ruff: noqa: E402
from pm.patches.beanie_links import patch_beanie_construct_query

patch_beanie_construct_query()

# Configure logging early
from pm.logging import configure_logging

configure_logging()

from collections.abc import Awaitable, Callable
from http import HTTPMethod, HTTPStatus

import sentry_sdk
from beanie import init_beanie
from fastapi import FastAPI, Request, Response
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from starsol_fastapi_jwt_auth import AuthJWT
from starsol_fastapi_jwt_auth.exceptions import AuthJWTException

from pm.api.views.output import ErrorOutput
from pm.config import CONFIG
from pm.constants import SENTRY_PACKAGE_NAME
from pm.utils.document import init_read_only_projection_models
from pm.version import APP_VERSION

if CONFIG.SENTRY_DSN:
    sentry_sdk.init(
        dsn=CONFIG.SENTRY_DSN,
        release=f'{SENTRY_PACKAGE_NAME}@{APP_VERSION}',
        environment=CONFIG.SENTRY_ENVIRONMENT,
        ca_certs=CONFIG.SENTRY_CA_CERTS,
        debug=CONFIG.DEBUG,
        sample_rate=CONFIG.SENTRY_SAMPLE_RATE,
        traces_sample_rate=CONFIG.SENTRY_TRACES_SAMPLE_RATE,
        profiles_sample_rate=CONFIG.SENTRY_PROFILES_SAMPLE_RATE,
    )


app = FastAPI(title='Snail Orbit', version=APP_VERSION, debug=CONFIG.DEBUG)


if CONFIG.ENABLE_PROFILING:
    from pyinstrument import Profiler

    @app.middleware('http')
    async def profiling_middleware(
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        profiling = request.query_params.get('profiling', False)
        if not profiling:
            return await call_next(request)
        profiler = Profiler()
        profiler.start()
        await call_next(request)
        profiler.stop()
        return HTMLResponse(profiler.output_html())


app.add_middleware(
    CORSMiddleware,
    allow_origins=CONFIG.ORIGINS,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# Add logging middleware for request correlation and context
from pm.logging import create_logging_middleware

app.middleware('http')(create_logging_middleware())

if CONFIG.RO_MODE:
    RO_METHODS = {HTTPMethod.GET, HTTPMethod.HEAD, HTTPMethod.OPTIONS}

    @app.middleware('http')
    async def ro_mode_middleware(
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        if request.method in RO_METHODS:
            return await call_next(request)
        return JSONResponse(
            status_code=HTTPStatus.SERVICE_UNAVAILABLE,
            content=jsonable_encoder(
                ErrorOutput(error_messages=['Server is in the read-only mode']),
            ),
        )


async def _init_system_groups() -> None:
    """Initialize default system groups that should always exist."""
    import pm.models as m

    existing_all_users = await m.AllUsersGroup.find_one()
    if not existing_all_users:
        all_users_group = m.AllUsersGroup(
            name='All Users', description='System group containing all users'
        )
        await all_users_group.insert()

    existing_system_admins = await m.SystemAdminsGroup.find_one()
    if not existing_system_admins:
        system_admins_group = m.SystemAdminsGroup(
            name='System Admins',
            description='System group containing all administrators',
        )
        await system_admins_group.insert()


@app.on_event('startup')
async def app_init() -> None:
    from pm.db import check_database_version
    from pm.models import __beanie_models__
    from pm.tasks.app import broker

    check_database_version()

    client = AsyncIOMotorClient(CONFIG.DB_URI)
    db = client.get_default_database()
    await init_beanie(db, document_models=__beanie_models__)
    init_read_only_projection_models(__beanie_models__)

    await _init_system_groups()

    # Initialize taskiq broker for task kicking
    await broker.startup()


@AuthJWT.load_config
def get_config() -> BaseModel:
    class Settings(BaseModel):
        authjwt_secret_key: str = CONFIG.JWT_SECRET
        authjwt_token_location: set = {'headers', 'cookies'}
        authjwt_cookie_secure: bool = True
        authjwt_refresh_cookie_path: str = '/api/auth/refresh'
        authjwt_cookie_samesite: str = 'none' if CONFIG.DEV_MODE else 'strict'
        authjwt_cookie_csrf_protect: bool = not CONFIG.DEV_MODE

    return Settings()


@app.exception_handler(AuthJWTException)
def authjwt_exception_handler(_: Request, exc: AuthJWTException) -> JSONResponse:
    # noinspection PyUnresolvedReferences
    return JSONResponse(
        status_code=401,
        content={'success': False, 'detail': exc.message, 'type': 'jwt_auth_error'},
    )


from pm.api.error_handlers import connect_error_handlers

connect_error_handlers(app)


@app.on_event('shutdown')
async def app_shutdown() -> None:
    from pm.tasks.app import broker

    # Clean shutdown of taskiq broker
    await broker.shutdown()


from pm.api.routes import api_router, events_router

app.include_router(api_router)
app.include_router(events_router)

if CONFIG.OIDC_ENABLED:
    from pm.api.routes.api.auth.oidc import oidc_app

    app.mount('/api/auth/oidc', oidc_app)
