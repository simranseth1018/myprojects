package io.javaframework.web.http;

/**
 * Enumeration of HTTP methods (verbs).
 *
 * <h2>HTTP Methods — REST semantics:</h2>
 * <pre>
 *   Method   | Safe | Idempotent | Has Body | Purpose
 *   ─────────┼──────┼────────────┼──────────┼────────────────────────
 *   GET      |  ✓   |     ✓      |    ✗     | Read resource(s)
 *   POST     |  ✗   |     ✗      |    ✓     | Create resource
 *   PUT      |  ✗   |     ✓      |    ✓     | Replace resource fully
 *   PATCH    |  ✗   |     ✗      |    ✓     | Partial update
 *   DELETE   |  ✗   |     ✓      |  rarely  | Remove resource
 *   HEAD     |  ✓   |     ✓      |    ✗     | Like GET but no body (metadata only)
 *   OPTIONS  |  ✓   |     ✓      |    ✗     | What methods does this endpoint support?
 * </pre>
 *
 * <h2>Safe:</h2> Reading doesn't change server state (GET, HEAD, OPTIONS).
 * <h2>Idempotent:</h2> Multiple identical requests = same result as one (GET, PUT, DELETE).
 *
 * @see HttpRequest
 */
public enum HttpMethod {
    GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS, TRACE;

    /**
     * Parses a string method name to an HttpMethod enum value.
     *
     * @param method the HTTP method string (case-insensitive)
     * @return the corresponding HttpMethod
     * @throws IllegalArgumentException if the method is unknown
     */
    public static HttpMethod fromString(String method) {
        try {
            return valueOf(method.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Unknown HTTP method: " + method);
        }
    }

    /**
     * Returns true if this method typically carries a request body.
     */
    public boolean hasRequestBody() {
        return this == POST || this == PUT || this == PATCH;
    }

    /**
     * Returns true if this method is safe (read-only, no side effects).
     */
    public boolean isSafe() {
        return this == GET || this == HEAD || this == OPTIONS || this == TRACE;
    }

    /**
     * Returns true if this method is idempotent.
     */
    public boolean isIdempotent() {
        return this == GET || this == PUT || this == DELETE ||
               this == HEAD || this == OPTIONS || this == TRACE;
    }
}
