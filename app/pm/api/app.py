# pylint: disable=wrong-import-position, import-outside-toplevel, ungrouped-imports
from collections.abc import Awaitable, Callable

import sentry_sdk
from beanie import init_beanie
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from starsol_fastapi_jwt_auth import AuthJWT
from starsol_fastapi_jwt_auth.exceptions import AuthJWTException

from pm.config import CONFIG
from pm.version import APP_VERSION

if CONFIG.SENTRY_DSN:
    sentry_sdk.init(
        dsn=CONFIG.SENTRY_DSN,
        release=f'{CONFIG.SENTRY_PROJECT_SLUG}@{APP_VERSION}'
        if CONFIG.SENTRY_PROJECT_SLUG
        else None,
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
        request: Request, call_next: Callable[[Request], Awaitable[Response]]
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


@app.on_event('startup')
async def app_init() -> None:
    from pm.models import __beanie_models__

    client = AsyncIOMotorClient(CONFIG.DB_URI)
    db = client.get_default_database()
    await init_beanie(db, document_models=__beanie_models__)


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


from pm.api.error_handlers import connect_error_handlers  # noqa

connect_error_handlers(app)


from pm.api.routes import api_router, events_router  # noqa

app.include_router(api_router)
app.include_router(events_router)
