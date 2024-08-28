from beanie import init_beanie
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from starlette.requests import Request
from starlette.responses import JSONResponse
from starsol_fastapi_jwt_auth import AuthJWT
from starsol_fastapi_jwt_auth.exceptions import AuthJWTException

from pm.config import CONFIG
from pm.constants import VERSION

app = FastAPI(title='Project Manager', version=VERSION, debug=CONFIG.DEBUG)

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


# pylint: disable=wrong-import-position
from pm.api.routes import api_router, events_router  # noqa

app.include_router(api_router)
app.include_router(events_router)
