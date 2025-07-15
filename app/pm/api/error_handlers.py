# pylint: disable=unused-argument
# ruff: noqa: ARG001
from http import HTTPStatus

from fastapi import FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from pm.api.exceptions import MFARequiredError, ValidateModelError
from pm.api.views.output import ErrorOutput, ErrorPayloadOutput, MFARequiredOutput

__all__ = ('connect_error_handlers',)


def connect_error_handlers(app: FastAPI) -> None:
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(
        RequestValidationError,
        request_validation_exception_handler,
    )
    app.add_exception_handler(ValidateModelError, validate_model_exception_handler)
    app.add_exception_handler(MFARequiredError, mfa_required_exception_handler)


async def http_exception_handler(
    request: Request,
    exc: StarletteHTTPException,
) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content=jsonable_encoder(ErrorOutput(error_messages=[exc.detail])),
    )


async def request_validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    return JSONResponse(
        status_code=HTTPStatus.UNPROCESSABLE_ENTITY,
        content=jsonable_encoder(
            ErrorOutput(
                error_messages=[
                    f'{error["loc"][0]}: {error["loc"][1]}: {error.get("msg")}'
                    for error in exc.errors()
                ],
            ),
        ),
    )


async def validate_model_exception_handler(
    request: Request,
    exc: ValidateModelError,
) -> JSONResponse:
    return JSONResponse(
        status_code=HTTPStatus.BAD_REQUEST,
        content=jsonable_encoder(
            ErrorPayloadOutput(
                error_messages=exc.error_messages,
                payload=exc.payload,
                error_fields=exc.error_fields,
            ),
        ),
    )


async def mfa_required_exception_handler(
    request: Request,
    exc: MFARequiredError,
) -> JSONResponse:
    return JSONResponse(
        status_code=HTTPStatus.BAD_REQUEST,
        content=jsonable_encoder(MFARequiredOutput()),
    )
