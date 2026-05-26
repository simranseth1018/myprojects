package io.javaframework.web.http;

import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Framework's abstraction for building and sending an HTTP response.
 *
 * <h2>Builder pattern:</h2>
 * HttpResponse uses a fluent builder API for clean response construction:
 * <pre>{@code
 *   HttpResponse.status(HttpStatus.CREATED)
 *               .header("Location", "/users/42")
 *               .json(createdUser);
 * }</pre>
 *
 * This is much cleaner than manually calling:
 * <pre>{@code
 *   servletResponse.setStatus(201);
 *   servletResponse.setHeader("Location", "/users/42");
 *   servletResponse.setContentType("application/json");
 *   servletResponse.getWriter().write(json);
 * }</pre>
 *
 * <h2>Committing the response:</h2>
 * HTTP responses are "committed" when the first byte is written to the socket.
 * After commit, you CANNOT change the status code or headers — they've already
 * been sent. Our write() method commits the response.
 * Spring's ResponseEntity works the same way.
 *
 * @see HttpRequest
 * @see HttpStatus
 */
public class HttpResponse {

    private HttpStatus status = HttpStatus.OK;
    private final Map<String, String> headers = new LinkedHashMap<>();
    private String body;
    private String contentType = "application/json; charset=UTF-8";

    // Private constructor — use factory methods
    private HttpResponse() {}

    // ─── Factory methods ───────────────────────────────────────────────────────

    /** Start building a response with the given status. */
    public static HttpResponse status(HttpStatus status) {
        HttpResponse response = new HttpResponse();
        response.status = status;
        return response;
    }

    /** Convenience: 200 OK. */
    public static HttpResponse ok() {
        return status(HttpStatus.OK);
    }

    /** Convenience: 201 Created. */
    public static HttpResponse created() {
        return status(HttpStatus.CREATED);
    }

    /** Convenience: 204 No Content. */
    public static HttpResponse noContent() {
        return status(HttpStatus.NO_CONTENT);
    }

    /** Convenience: 400 Bad Request. */
    public static HttpResponse badRequest() {
        return status(HttpStatus.BAD_REQUEST);
    }

    /** Convenience: 404 Not Found. */
    public static HttpResponse notFound() {
        return status(HttpStatus.NOT_FOUND);
    }

    /** Convenience: 500 Internal Server Error. */
    public static HttpResponse serverError() {
        return status(HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // ─── Fluent builder methods ────────────────────────────────────────────────

    /** Adds a response header. */
    public HttpResponse header(String name, String value) {
        headers.put(name, value);
        return this;
    }

    /** Sets the Content-Type header. */
    public HttpResponse contentType(String contentType) {
        this.contentType = contentType;
        return this;
    }

    /** Sets a pre-serialized JSON body string. */
    public HttpResponse json(String jsonBody) {
        this.body = jsonBody;
        this.contentType = "application/json; charset=UTF-8";
        return this;
    }

    /** Sets a plain text body. */
    public HttpResponse text(String text) {
        this.body = text;
        this.contentType = "text/plain; charset=UTF-8";
        return this;
    }

    // ─── Accessors ─────────────────────────────────────────────────────────────

    public HttpStatus getStatus() {
        return status;
    }

    public void setStatus(HttpStatus status) {
        this.status = status;
    }

    public Map<String, String> getHeaders() {
        return headers;
    }

    public String getBody() {
        return body;
    }

    public void setBody(String body) {
        this.body = body;
    }

    public String getContentType() {
        return contentType;
    }

    // ─── Writing to servlet response ──────────────────────────────────────────

    /**
     * Writes this response to the underlying servlet response.
     *
     * <p>After this call, the HTTP response is "committed" — no further
     * modifications are possible. This is the ONLY point we touch the Servlet API.
     *
     * @param servletResponse the underlying servlet response to write to
     */
    public void writeTo(HttpServletResponse servletResponse) throws IOException {
        // Set status code
        servletResponse.setStatus(status.getCode());

        // Set Content-Type
        servletResponse.setContentType(contentType);
        servletResponse.setCharacterEncoding("UTF-8");

        // Set custom headers
        headers.forEach(servletResponse::setHeader);

        // Write CORS headers (basic — Phase 3 will add configurable CORS)
        servletResponse.setHeader("Access-Control-Allow-Origin", "*");

        // Write body if present
        if (body != null && !body.isBlank()) {
            byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
            servletResponse.setContentLength(bytes.length);
            servletResponse.getOutputStream().write(bytes);
        }
    }

    @Override
    public String toString() {
        return "HttpResponse{status=%s, contentType='%s', bodyLength=%d}"
            .formatted(status, contentType, body != null ? body.length() : 0);
    }
}
