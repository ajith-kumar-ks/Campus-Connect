import logging
import time
import uuid

from fastapi import Request


logger = logging.getLogger(__name__)


async def request_tracking_middleware(
    request: Request,
    call_next
):
    # 1. Generate a unique ID for this request
    request_id = str(uuid.uuid4())

    # 2. Store it in request.state
    request.state.request_id = request_id

    # 3. Record request start time
    start_time = time.perf_counter()

    # 4. Process the actual request
    response = await call_next(request)

    # 5. Calculate execution time
    process_time = time.perf_counter() - start_time

    # 6. Attach request ID to the response
    response.headers["X-Request-ID"] = request_id

    # 7. Attach processing time to the response
    response.headers["X-Process-Time"] = str(
        round(process_time, 4)
    )

    # 8. Log request information
    logger.info(
        "%s %s | Status: %s | Duration: %.4fs | Request ID: %s",
        request.method,
        request.url.path,
        response.status_code,
        process_time,
        request_id
    )

    return response