from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starsol_sql_base.db import init_engine

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
    init_engine(CONFIG.DB_URI)


# pylint: disable=wrong-import-position
from pm.api.routes import api_router # noqa

app.include_router(api_router)
