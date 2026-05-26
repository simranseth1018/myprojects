package io.javaframework.web.http;

import javax.servlet.http.HttpServletRequest;
import java.io.BufferedReader;
import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Framework's abstraction over an incoming HTTP request.
 *
 * <h2>Why abstract over HttpServletRequest?</h2>
 * If we use {@code HttpServletRequest} directly everywhere in the framework,
 * we're tightly coupled to the Servlet API. If we ever want to support:
 * - Reactive HTTP (Project Reactor / Vert.x)
 * - Native Jetty API (non-servlet)
 * - Testing (mocking HttpServletRequest is painful)
 *
 * ...we'd have to change every class that touches requests.
 *
 * By wrapping it in our own {@code HttpRequest}, we have ONE adapter class
 * that talks to Servlet API, and everything else talks to HttpRequest.
 * This is the "Adapter" pattern.
 *
 * <h2>Spring comparison:</h2>
 * Spring's {@code ServerWebExchange} (reactive) and {@code NativeWebRequest}
 * (servlet) serve the same purpose — abstracting the underlying HTTP stack.
 *
 * <h2>Immutability:</h2>
 * An HttpRequest object represents a point-in-time snapshot of the incoming request.
 * Once created, its headers, method, and path are immutable. Only path variables
 * (extracted by the Router) and attributes (set by middleware) can be modified.
 *
 * @see HttpResponse
 * @see HttpMethod
 */
public class HttpRequest {

    // ── Core request data ─────────────────────────────────────────────────────
    private final HttpMethod method;
    private final String path;
    private final Map<String, List<String>> headers;
    private final Map<String, String> queryParams;
    private final String body;
    private final String remoteAddress;

    // ── Mutable data added by Router/Middleware ────────────────────────────────
    private Map<String, String> pathVariables = new HashMap<>();
    private final Map<String, Object> attributes = new HashMap<>();

    // ─── Factory method — creates from servlet request ─────────────────────────

    /**
     * Creates an HttpRequest by reading from a servlet request.
     *
     * <p>This is the ONLY point where we touch the Servlet API.
     * Everything else in the framework uses our HttpRequest.
     *
     * @param servletRequest the underlying servlet request
     * @return the framework's HttpRequest
     */
    public static HttpRequest from(HttpServletRequest servletRequest) {
        HttpMethod method = HttpMethod.fromString(servletRequest.getMethod());
        String path = servletRequest.getRequestURI();
        Map<String, List<String>> headers = extractHeaders(servletRequest);
        Map<String, String> queryParams = extractQueryParams(servletRequest);
        String body = extractBody(servletRequest);
        String remoteAddr = servletRequest.getRemoteAddr();

        return new HttpRequest(method, path, headers, queryParams, body, remoteAddr);
    }

    private HttpRequest(HttpMethod method, String path,
                        Map<String, List<String>> headers,
                        Map<String, String> queryParams,
                        String body,
                        String remoteAddress) {
        this.method = method;
        this.path = path;
        this.headers = Collections.unmodifiableMap(headers);
        this.queryParams = Collections.unmodifiableMap(queryParams);
        this.body = body;
        this.remoteAddress = remoteAddress;
    }

    // ─── Accessors ─────────────────────────────────────────────────────────────

    public HttpMethod getMethod() {
        return method;
    }

    public String getPath() {
        return path;
    }

    /** Returns the first value of the named header (case-insensitive). */
    public Optional<String> getHeader(String name) {
        return headers.entrySet().stream()
            .filter(e -> e.getKey().equalsIgnoreCase(name))
            .map(e -> e.getValue().get(0))
            .findFirst();
    }

    public Map<String, List<String>> getHeaders() {
        return headers;
    }

    /** Returns the value of a query parameter, or empty if not present. */
    public Optional<String> getQueryParam(String name) {
        return Optional.ofNullable(queryParams.get(name));
    }

    public Map<String, String> getQueryParams() {
        return queryParams;
    }

    /** Returns the raw request body as a string. */
    public String getBody() {
        return body;
    }

    public boolean hasBody() {
        return body != null && !body.isBlank();
    }

    public String getRemoteAddress() {
        return remoteAddress;
    }

    /** Returns the Content-Type header value. */
    public Optional<String> getContentType() {
        return getHeader("Content-Type");
    }

    // ─── Path variables (set by Router after route matching) ──────────────────

    /**
     * Returns the extracted path variable for the given name.
     *
     * <p>For route {@code /users/{id}} and path {@code /users/42},
     * {@code getPathVariable("id")} returns {@code "42"}.
     */
    public Optional<String> getPathVariable(String name) {
        return Optional.ofNullable(pathVariables.get(name));
    }

    /** Called by the Router to set extracted path variables. */
    public void setPathVariables(Map<String, String> pathVariables) {
        this.pathVariables = new HashMap<>(pathVariables);
    }

    public Map<String, String> getPathVariables() {
        return Collections.unmodifiableMap(pathVariables);
    }

    // ─── Attributes (middleware scratch-pad) ──────────────────────────────────

    /**
     * Stores an attribute on the request.
     *
     * <p>Middleware can use this to pass data to controllers.
     * For example, an authentication middleware might store the current user:
     * {@code request.setAttribute("currentUser", user);}
     *
     * @param name  the attribute name
     * @param value the attribute value
     */
    public void setAttribute(String name, Object value) {
        attributes.put(name, value);
    }

    @SuppressWarnings("unchecked")
    public <T> Optional<T> getAttribute(String name) {
        return Optional.ofNullable((T) attributes.get(name));
    }

    // ─── Private extraction helpers ───────────────────────────────────────────

    private static Map<String, List<String>> extractHeaders(HttpServletRequest req) {
        Map<String, List<String>> headers = new LinkedHashMap<>();
        Enumeration<String> names = req.getHeaderNames();
        while (names != null && names.hasMoreElements()) {
            String name = names.nextElement();
            List<String> values = Collections.list(req.getHeaders(name));
            headers.put(name, values);
        }
        return headers;
    }

    private static Map<String, String> extractQueryParams(HttpServletRequest req) {
        Map<String, String> params = new LinkedHashMap<>();
        if (req.getQueryString() == null) return params;

        String query = req.getQueryString();
        for (String pair : query.split("&")) {
            int idx = pair.indexOf('=');
            if (idx > 0) {
                String key = pair.substring(0, idx);
                String value = pair.substring(idx + 1);
                params.put(key, value);
            } else if (!pair.isBlank()) {
                params.put(pair, "");
            }
        }
        return params;
    }

    private static String extractBody(HttpServletRequest req) {
        try (BufferedReader reader = req.getReader()) {
            return reader.lines().collect(Collectors.joining("\n"));
        } catch (IOException e) {
            return "";
        }
    }

    @Override
    public String toString() {
        return "HttpRequest{%s %s}".formatted(method, path);
    }
}
