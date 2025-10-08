import uuid
from collections.abc import Awaitable, Callable

from fastapi import Request, Response

from pm.api.logging.context import set_api_logging_context
from pm.api.request_ctx import set_request_context

__all__ = ('RequestIDMiddleware',)


class RequestIDMiddleware:
    async def __call__(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        request_id = str(uuid.uuid4())

        set_request_context(request, request_id=request_id)
        set_api_logging_context(request_id=request_id)
        response = await call_next(request)
        response.headers['X-Request-ID'] = request_id
        return response
