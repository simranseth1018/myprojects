package io.javaframework.web.routing;

import io.javaframework.web.http.HttpMethod;

import java.lang.reflect.Method;
import java.util.List;
import java.util.Objects;

/**
 * Describes a single registered route: a combination of HTTP method + URL pattern
 * mapped to a specific controller method.
 *
 * <h2>What this stores:</h2>
 * <pre>
 *   GET /users/{id}  → UserController.getById(Long id)
 *   ^   ^              ^               ^
 *   |   |              |               |
 *   HTTP method   path pattern    controller bean + method to invoke
 * </pre>
 *
 * <h2>Spring comparison:</h2>
 * Spring's equivalent is {@code HandlerMethod} (the handler) combined with
 * {@code RequestMappingInfo} (the matching criteria: method, path, headers, params, etc.).
 * Spring's {@code RequestMappingHandlerMapping} builds a map of these at startup.
 *
 * Our simpler version stores: method + pathPattern + handler (controller bean + method).
 *
 * <h2>Path pattern types (our progression):</h2>
 * Phase 1: Literal paths (/users, /health)
 * Phase 1: Path variables (/users/{id}, /orders/{orderId}/items/{itemId})
 * Phase 3: Wildcards (/users/**)
 * Phase 4: Regex (/users/{id:[0-9]+})
 *
 * @see Router
 * @see RouteMatch
 */
public class RouteDefinition {

    /** The HTTP method this route handles. */
    private final HttpMethod httpMethod;

    /**
     * The URL path pattern. May contain path variables like {id}.
     * E.g., "/users/{id}", "/api/v1/orders/{orderId}/items/{itemId}"
     */
    private final String pathPattern;

    /**
     * Path variable names extracted from the pattern.
     * For "/users/{id}/orders/{orderId}" this would be ["id", "orderId"].
     *
     * <p>Pre-computed at registration time for performance.
     */
    private final List<String> pathVariableNames;

    /**
     * The controller bean instance (singleton from the IoC container).
     * The Method is called ON this instance.
     */
    private final Object controllerBean;

    /**
     * The Java reflection Method to invoke when this route is matched.
     * E.g., UserController.getById(Long)
     */
    private final Method handlerMethod;

    /** Human-readable description for logging. */
    private final String description;

    public RouteDefinition(HttpMethod httpMethod,
                           String pathPattern,
                           Object controllerBean,
                           Method handlerMethod) {
        this.httpMethod = Objects.requireNonNull(httpMethod);
        this.pathPattern = Objects.requireNonNull(pathPattern);
        this.controllerBean = Objects.requireNonNull(controllerBean);
        this.handlerMethod = Objects.requireNonNull(handlerMethod);
        this.pathVariableNames = PathMatcher.extractVariableNames(pathPattern);
        this.description = "%s %s → %s.%s()"
            .formatted(httpMethod, pathPattern,
                controllerBean.getClass().getSimpleName(), handlerMethod.getName());
    }

    // ─── Accessors ─────────────────────────────────────────────────────────────

    public HttpMethod getHttpMethod() { return httpMethod; }
    public String getPathPattern() { return pathPattern; }
    public List<String> getPathVariableNames() { return pathVariableNames; }
    public Object getControllerBean() { return controllerBean; }
    public Method getHandlerMethod() { return handlerMethod; }

    /** Returns true if this route has any path variables. */
    public boolean hasPathVariables() {
        return !pathVariableNames.isEmpty();
    }

    @Override
    public String toString() {
        return description;
    }
}
