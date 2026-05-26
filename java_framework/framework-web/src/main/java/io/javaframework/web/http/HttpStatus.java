package io.javaframework.web.http;

/**
 * HTTP status codes with their standard reason phrases.
 *
 * <h2>Status Code Categories:</h2>
 * <pre>
 *   1xx — Informational  (request received, continuing)
 *   2xx — Success        (request received, understood, accepted)
 *   3xx — Redirection    (further action needed)
 *   4xx — Client Error   (request has bad syntax or cannot be fulfilled)
 *   5xx — Server Error   (server failed to fulfill a valid request)
 * </pre>
 *
 * <h2>Most important for REST APIs:</h2>
 * <pre>
 *   200 OK             — Successful GET, PUT, PATCH, DELETE
 *   201 Created        — Successful POST (new resource created)
 *   204 No Content     — Successful DELETE with no body
 *   400 Bad Request    — Invalid request body/params
 *   401 Unauthorized   — Not authenticated
 *   403 Forbidden      — Authenticated but not authorized
 *   404 Not Found      — Resource doesn't exist
 *   405 Method Not Allowed — Wrong HTTP verb for this endpoint
 *   409 Conflict       — State conflict (e.g., duplicate resource)
 *   422 Unprocessable  — Validation errors
 *   500 Internal Error — Unexpected server error
 * </pre>
 */
public enum HttpStatus {

    // 2xx Success
    OK(200, "OK"),
    CREATED(201, "Created"),
    ACCEPTED(202, "Accepted"),
    NO_CONTENT(204, "No Content"),

    // 3xx Redirection
    MOVED_PERMANENTLY(301, "Moved Permanently"),
    FOUND(302, "Found"),
    NOT_MODIFIED(304, "Not Modified"),

    // 4xx Client Error
    BAD_REQUEST(400, "Bad Request"),
    UNAUTHORIZED(401, "Unauthorized"),
    FORBIDDEN(403, "Forbidden"),
    NOT_FOUND(404, "Not Found"),
    METHOD_NOT_ALLOWED(405, "Method Not Allowed"),
    CONFLICT(409, "Conflict"),
    UNPROCESSABLE_ENTITY(422, "Unprocessable Entity"),
    TOO_MANY_REQUESTS(429, "Too Many Requests"),

    // 5xx Server Error
    INTERNAL_SERVER_ERROR(500, "Internal Server Error"),
    NOT_IMPLEMENTED(501, "Not Implemented"),
    BAD_GATEWAY(502, "Bad Gateway"),
    SERVICE_UNAVAILABLE(503, "Service Unavailable"),
    GATEWAY_TIMEOUT(504, "Gateway Timeout");

    private final int code;
    private final String reason;

    HttpStatus(int code, String reason) {
        this.code = code;
        this.reason = reason;
    }

    public int getCode() {
        return code;
    }

    public String getReason() {
        return reason;
    }

    public boolean is2xxSuccessful() {
        return code >= 200 && code < 300;
    }

    public boolean is4xxClientError() {
        return code >= 400 && code < 500;
    }

    public boolean is5xxServerError() {
        return code >= 500 && code < 600;
    }

    public static HttpStatus fromCode(int code) {
        for (HttpStatus status : values()) {
            if (status.code == code) return status;
        }
        throw new IllegalArgumentException("Unknown HTTP status code: " + code);
    }

    @Override
    public String toString() {
        return "%d %s".formatted(code, reason);
    }
}
