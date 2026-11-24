import logging

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.exceptions import RequestValidationError


logger = logging.getLogger(__name__)
#It creates or retrieves a logger object.We use this logger to record messages from our application.
# Why use __name__? Because when our application grows, we can identify which module generated a particular log


async def http_exception_handler(
    request: Request,
    exc: StarletteHTTPException
):
    detail = exc.detail

    message = detail if isinstance(detail, str) else "Request failed"

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": message,
            "status_code": exc.status_code,
            "errors": detail if not isinstance(detail, str) else None
        },
        headers=exc.headers
    )


async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError
):
    errors = [
        {
            "field": ".".join(str(part) for part in error["loc"]),
            "message": error["msg"],
            "type": error["type"]
        }
        for error in exc.errors()
    ]

    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "message": "Request validation failed",
            "status_code": 422,
            "errors": errors
        }
    )


async def general_exception_handler(
    request: Request,
    exc: Exception
):
    logger.exception(
        "Unhandled exception occurred while processing %s %s",
        request.method,
        request.url.path
    )   #logger.exception() logs an error message along with the traceback of the current exception.

    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Internal server error",
            "status_code": 500,
            "errors": None
        }
    )
#We log the actual exception internally, but we don't expose its traceback or internal details to the frontend. This is a security best practice.