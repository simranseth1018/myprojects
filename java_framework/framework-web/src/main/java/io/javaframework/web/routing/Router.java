package io.javaframework.web.routing;

import io.javaframework.web.http.HttpMethod;
import io.javaframework.web.http.HttpStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.lang.reflect.Method;
import java.util.*;

/**
 * The routing engine — maps incoming HTTP requests to controller methods.
 *
 * <h2>Router's responsibilities:</h2>
 * <ol>
 *   <li>Accept route registrations at startup (from ControllerInvoker)</li>
 *   <li>On each request: find the best matching route</li>
 *   <li>Return a RouteMatch containing the handler + extracted path variables</li>
 * </ol>
 *
 * <h2>Spring comparison:</h2>
 * Spring's equivalent components:
 * - {@code RequestMappingHandlerMapping.detectHandlerMethods()} — scans controllers at startup
 * - {@code AbstractHandlerMapping.getHandler()} — finds handler at request time
 * - {@code RequestMappingInfo.getMatchingCondition()} — tests if a request matches a route
 *
 * Spring's HandlerMapping has sophisticated matching with priority ordering.
 * Literal patterns beat variable patterns. Specific paths beat wildcards.
 *
 * <h2>Route matching order (most specific wins):</h2>
 * Given routes: {@code /users/profile} and {@code /users/{id}}
 * Request: {@code GET /users/profile}
 * → Should match {@code /users/profile} (literal), NOT {@code /users/{id}} (variable)
 *
 * Our implementation: literal routes are tested first, then variable routes.
 *
 * <h2>Performance considerations:</h2>
 * - At startup: O(r) to register routes where r = number of routes
 * - At request time: O(r) to find a match (linear scan)
 * - Production improvement: use a Trie (prefix tree) for O(d) lookup where d = path depth
 * - Spring Boot uses a compiled PathPattern with a fast trie structure
 *
 * @see RouteDefinition
 * @see RouteMatch
 * @see PathMatcher
 */
public class Router {

    private static final Logger log = LoggerFactory.getLogger(Router.class);

    /**
     * All registered routes.
     *
     * <h3>Storage strategy:</h3>
     * We keep two lists:
     * - Literal routes: no variables, can be matched with HashMap lookup O(1)
     * - Variable routes: have {variables}, require pattern matching O(n)
     *
     * On every request, we check literal routes first (O(1)), then
     * scan variable routes (O(r_var) where r_var = variable route count).
     */
    private final Map<String, RouteDefinition> literalRoutes = new LinkedHashMap<>();
    private final List<RouteDefinition> variableRoutes = new ArrayList<>();

    // ─── Route registration ────────────────────────────────────────────────────

    /**
     * Registers a route.
     *
     * <p>Called once per @GetMapping/@PostMapping method at startup.
     * The route key combines HTTP method + path for exact lookup.
     *
     * @param definition the route to register
     */
    public void register(RouteDefinition definition) {
        String key = routeKey(definition.getHttpMethod(), definition.getPathPattern());

        if (definition.hasPathVariables()) {
            variableRoutes.add(definition);
            log.debug("Registered variable route: {}", definition);
        } else {
            literalRoutes.put(key, definition);
            log.debug("Registered literal route: {}", definition);
        }
    }

    /**
     * Convenience: register a route from its components.
     */
    public void register(HttpMethod method, String path, Object controllerBean, Method handlerMethod) {
        register(new RouteDefinition(method, path, controllerBean, handlerMethod));
    }

    // ─── Route resolution ──────────────────────────────────────────────────────

    /**
     * Finds the best matching route for an incoming request.
     *
     * <h3>Matching algorithm:</h3>
     * <ol>
     *   <li>Try exact literal match (O(1) HashMap lookup)</li>
     *   <li>Try variable pattern match (O(n) linear scan)</li>
     *   <li>If no match for the path at all: Optional.empty()</li>
     *   <li>If path matched but wrong method: set methodNotAllowed flag</li>
     * </ol>
     *
     * <h3>405 vs 404 distinction:</h3>
     * - 404: The path itself doesn't exist. {@code GET /nonexistent}
     * - 405: The path exists but not for this method. {@code DELETE /users} when only
     *         {@code GET /users} and {@code POST /users} are registered.
     *
     * This matters for API clarity — 404 means "wrong path", 405 means "wrong verb".
     *
     * @param method      the HTTP method of the incoming request
     * @param incomingPath the URL path of the incoming request
     * @return a RouteMatch if found, or empty
     */
    public Optional<RouteMatch> resolve(HttpMethod method, String incomingPath) {
        // ── Phase 1: Try exact literal match ──────────────────────────────────
        String key = routeKey(method, incomingPath);
        RouteDefinition exact = literalRoutes.get(key);
        if (exact != null) {
            return Optional.of(new RouteMatch(exact, Collections.emptyMap()));
        }

        // ── Phase 2: Try pattern match for variable routes ────────────────────
        for (RouteDefinition route : variableRoutes) {
            if (route.getHttpMethod() != method) continue;

            if (PathMatcher.matches(route.getPathPattern(), incomingPath)) {
                Map<String, String> vars = PathMatcher.extractPathVariables(
                    route.getPathPattern(), incomingPath);
                log.debug("Route matched: {} → {}", incomingPath, route);
                return Optional.of(new RouteMatch(route, vars));
            }
        }

        log.debug("No route matched: {} {}", method, incomingPath);
        return Optional.empty();
    }

    /**
     * Checks whether the path exists at all (regardless of HTTP method).
     *
     * <p>Used to distinguish 404 (path not found) from 405 (method not allowed).
     */
    public boolean pathExists(String incomingPath) {
        // Check literal routes (any method)
        boolean inLiterals = literalRoutes.keySet().stream()
            .anyMatch(key -> key.endsWith(":" + incomingPath));

        if (inLiterals) return true;

        // Check variable routes
        return variableRoutes.stream()
            .anyMatch(route -> PathMatcher.matches(route.getPathPattern(), incomingPath));
    }

    /**
     * Returns all HTTP methods supported for a given path.
     *
     * <p>Used to populate the {@code Allow} header in 405 responses.
     * Example: {@code Allow: GET, POST}
     */
    public Set<HttpMethod> getAllowedMethods(String incomingPath) {
        Set<HttpMethod> allowed = new LinkedHashSet<>();

        // Check literal routes
        for (Map.Entry<String, RouteDefinition> entry : literalRoutes.entrySet()) {
            if (entry.getKey().endsWith(":" + incomingPath)) {
                allowed.add(entry.getValue().getHttpMethod());
            }
        }

        // Check variable routes
        for (RouteDefinition route : variableRoutes) {
            if (PathMatcher.matches(route.getPathPattern(), incomingPath)) {
                allowed.add(route.getHttpMethod());
            }
        }

        return allowed;
    }

    /**
     * Returns all registered routes (for debugging, documentation, health-check).
     */
    public List<RouteDefinition> getAllRoutes() {
        List<RouteDefinition> all = new ArrayList<>(literalRoutes.values());
        all.addAll(variableRoutes);
        return Collections.unmodifiableList(all);
    }

    /**
     * Logs all registered routes in a table format.
     * Called at startup by the ApplicationContext.
     */
    public void logRoutes() {
        List<RouteDefinition> all = getAllRoutes();
        log.info("=== Registered Routes ({}) ===", all.size());
        all.forEach(route -> log.info("  {}", "%-7s %s".formatted(route.getHttpMethod(), route)));
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    /** Creates a unique string key for a method+path combination. */
    private static String routeKey(HttpMethod method, String path) {
        return method.name() + ":" + path;
    }
}
