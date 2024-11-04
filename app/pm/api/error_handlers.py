from http import HTTPStatus

from fastapi import FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from pm.api.exceptions import ValidateModelException
from pm.api.views.output import ErrorOutput, ErrorPayloadOutput

__all__ = ('connect_error_handlers',)


def connect_error_handlers(app: FastAPI) -> None:
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(
        RequestValidationError, request_validation_exception_handler
    )
    app.add_exception_handler(ValidateModelException, validate_model_exception_handler)


# pylint: disable=unused-argument
async def http_exception_handler(
    request: Request, exc: StarletteHTTPException
) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content=jsonable_encoder(ErrorOutput(error_messages=[exc.detail])),
    )


async def request_validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    return JSONResponse(
        status_code=HTTPStatus.UNPROCESSABLE_ENTITY,
        content=jsonable_encoder(
            ErrorOutput(
                error_messages=[
                    f'{error['loc'][0]}: {error['loc'][1]}: {error.get("msg")}'
                    for error in exc.errors()
                ]
            )
        ),
    )


async def validate_model_exception_handler(
    request: Request, exc: ValidateModelException
) -> JSONResponse:
    return JSONResponse(
        status_code=HTTPStatus.BAD_REQUEST,
        content=jsonable_encoder(
            ErrorPayloadOutput(
                error_messages=exc.error_messages,
                payload=exc.payload,
                error_fields=exc.error_fields,
            )
        ),
    )
