package io.javaframework.web.handler;

import io.javaframework.web.http.HttpMethod;
import io.javaframework.web.http.HttpRequest;
import io.javaframework.web.http.HttpResponse;
import io.javaframework.web.http.HttpStatus;
import io.javaframework.web.middleware.Middleware;
import io.javaframework.web.middleware.MiddlewareChain;
import io.javaframework.web.routing.RouteMatch;
import io.javaframework.web.routing.Router;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * The DispatcherServlet equivalent — orchestrates the full request pipeline.
 *
 * <h2>Request flow:</h2>
 * <pre>
 *   HttpRequest
 *       │
 *       ▼
 *   RequestHandler.handle()
 *       │
 *       ▼
 *   Router.resolve(method, path)
 *       │
 *       ├─── Not found ──────────────► 404 Not Found
 *       ├─── Path found, wrong method ► 405 Method Not Allowed
 *       │
 *       ▼
 *   MiddlewareChain.next(request)
 *       │
 *       ├─── [LoggingMiddleware]
 *       ├─── [AuthMiddleware]
 *       ├─── [RateLimitMiddleware]
 *       │
 *       ▼
 *   ControllerInvoker.invoke(match, request)
 *       │
 *       ▼
 *   HttpResponse
 * </pre>
 *
 * <h2>Spring comparison:</h2>
 * Spring's {@code DispatcherServlet.doDispatch()} is the equivalent:
 * <ol>
 *   <li>getHandler() — HandlerExecutionChain (handler + interceptors)</li>
 *   <li>getHandlerAdapter() — adapts handler to a common interface</li>
 *   <li>mappedHandler.applyPreHandle() — interceptors preHandle()</li>
 *   <li>ha.handle() — actual controller invocation</li>
 *   <li>mappedHandler.applyPostHandle() — interceptors postHandle()</li>
 *   <li>processDispatchResult() — view resolution or exception handling</li>
 *   <li>triggerAfterCompletion() — interceptors afterCompletion()</li>
 * </ol>
 *
 * @see Router
 * @see ControllerInvoker
 * @see Middleware
 */
public class RequestHandler {

    private static final Logger log = LoggerFactory.getLogger(RequestHandler.class);

    private final Router router;
    private final ControllerInvoker controllerInvoker;
    private final List<Middleware> middlewares;

    public RequestHandler(Router router, ControllerInvoker controllerInvoker,
                          List<Middleware> middlewares) {
        this.router = router;
        this.controllerInvoker = controllerInvoker;
        this.middlewares = List.copyOf(middlewares);
    }

    /**
     * Handles an incoming HTTP request end-to-end.
     *
     * @param request the incoming request
     * @return the response to send back
     */
    public HttpResponse handle(HttpRequest request) {
        log.debug("→ {} {}", request.getMethod(), request.getPath());

        try {
            // ── Step 1: Route resolution ────────────────────────────────────────
            Optional<RouteMatch> matchOpt = router.resolve(request.getMethod(), request.getPath());

            if (matchOpt.isEmpty()) {
                return handleNoRoute(request);
            }

            RouteMatch match = matchOpt.get();

            // ── Step 2: Build and execute middleware chain ──────────────────────
            // The final handler at the end of the chain invokes the controller
            MiddlewareChain chain = new MiddlewareChain(
                middlewares,
                req -> controllerInvoker.invoke(match, req)
            );

            HttpResponse response = chain.next(request);

            log.debug("← {} {} → {}", request.getMethod(), request.getPath(), response.getStatus());
            return response;

        } catch (IllegalArgumentException e) {
            // Bad request (missing params, type mismatch, etc.)
            log.warn("Bad request: {} {}: {}", request.getMethod(), request.getPath(), e.getMessage());
            return buildErrorResponse(HttpStatus.BAD_REQUEST, e.getMessage());

        } catch (Exception e) {
            // Unexpected server error
            log.error("Unhandled exception processing {} {}", request.getMethod(), request.getPath(), e);
            return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR,
                "Internal server error: " + e.getMessage());
        }
    }

    /**
     * Handles the case where no route matched.
     *
     * <p>Distinguishes between:
     * - 404: The path doesn't exist at all
     * - 405: The path exists but not for this HTTP method
     *
     * @param request the unmatched request
     * @return 404 or 405 response
     */
    private HttpResponse handleNoRoute(HttpRequest request) {
        if (router.pathExists(request.getPath())) {
            // Path exists, but wrong HTTP method — 405 Method Not Allowed
            Set<HttpMethod> allowed = router.getAllowedMethods(request.getPath());
            String allowedStr = allowed.stream()
                .map(Enum::name)
                .collect(Collectors.joining(", "));

            log.debug("405: {} not allowed for {}, allowed: {}", request.getMethod(), request.getPath(), allowedStr);

            return HttpResponse.status(HttpStatus.METHOD_NOT_ALLOWED)
                .header("Allow", allowedStr)
                .json("""
                    {"error": "Method Not Allowed", "allowed": "%s"}
                    """.formatted(allowedStr));
        }

        // Path not found — 404
        log.debug("404: {} {}", request.getMethod(), request.getPath());
        return buildErrorResponse(HttpStatus.NOT_FOUND,
            "No route found for %s %s".formatted(request.getMethod(), request.getPath()));
    }

    /**
     * Builds a standardized JSON error response.
     *
     * <h3>Error response format:</h3>
     * <pre>{@code
     *   {
     *     "error": "Not Found",
     *     "message": "No route found for GET /nonexistent",
     *     "status": 404
     *   }
     * }</pre>
     */
    private HttpResponse buildErrorResponse(HttpStatus status, String message) {
        String body = """
            {"error": "%s", "message": "%s", "status": %d}
            """.formatted(
                status.getReason(),
                message.replace("\"", "'"),  // escape quotes in message
                status.getCode()
            ).trim();

        return HttpResponse.status(status).json(body);
    }
}
