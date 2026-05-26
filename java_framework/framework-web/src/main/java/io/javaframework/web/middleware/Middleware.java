package io.javaframework.web.middleware;

import io.javaframework.web.http.HttpRequest;
import io.javaframework.web.http.HttpResponse;

/**
 * A middleware intercepts HTTP requests before and after the controller runs.
 *
 * <h2>What is Middleware?</h2>
 * Middleware is a function that receives a request, optionally does work,
 * then either:
 * a) Calls {@code chain.next()} to pass the request to the next middleware/controller
 * b) Returns a response directly (short-circuiting the chain) — e.g., for auth failures
 *
 * <h2>Spring equivalent:</h2>
 * Spring has two mechanisms:
 * <ul>
 *   <li>{@code HandlerInterceptor} — framework-level, runs inside Spring MVC
 *     (has access to ModelAndView, can see resolved handler)</li>
 *   <li>{@code Filter} (javax.servlet.Filter) — container-level, runs before Spring
 *     (cannot access Spring context easily)</li>
 * </ul>
 * Our Middleware is closest to HandlerInterceptor but implemented as a chain (like Filters).
 *
 * <h2>Express.js comparison (the inspiration):</h2>
 * <pre>{@code
 *   // Express.js middleware
 *   app.use((req, res, next) => {
 *     console.log('Request received:', req.method, req.path);
 *     next(); // pass to next middleware
 *   });
 * }</pre>
 *
 * Our Java equivalent:
 * <pre>{@code
 *   public class LoggingMiddleware implements Middleware {
 *       public HttpResponse handle(HttpRequest req, MiddlewareChain chain) {
 *           log.info("Request: {} {}", req.getMethod(), req.getPath());
 *           HttpResponse response = chain.next(req); // call next
 *           log.info("Response: {}", response.getStatus());
 *           return response;
 *       }
 *   }
 * }</pre>
 *
 * <h2>Middleware use cases:</h2>
 * <ul>
 *   <li>Logging — log all requests/responses</li>
 *   <li>Authentication — check JWT, reject unauthorized requests</li>
 *   <li>Rate limiting — reject if too many requests</li>
 *   <li>CORS — add cross-origin headers</li>
 *   <li>Request ID — add a unique ID to each request for tracing</li>
 *   <li>Compression — gzip responses</li>
 *   <li>Caching — return cached responses</li>
 *   <li>Metrics — record request duration</li>
 * </ul>
 *
 * <h2>Chain structure:</h2>
 * <pre>
 *   Request → [LoggingMiddleware] → [AuthMiddleware] → [RateLimitMiddleware] → Controller
 *             ↑ post-processing ←  ↑ post-processing ← ↑ post-processing ←   ↑ response
 * </pre>
 *
 * <h2>Interview Questions:</h2>
 * <ul>
 *   <li>What is the Chain of Responsibility pattern?</li>
 *   <li>What is the difference between Filter and HandlerInterceptor in Spring?</li>
 *   <li>How would you implement rate limiting in a middleware?</li>
 *   <li>How does middleware short-circuiting work?</li>
 *   <li>What's the difference between pre-processing and post-processing middleware?</li>
 * </ul>
 *
 * @see MiddlewareChain
 */
@FunctionalInterface
public interface Middleware {

    /**
     * Handles the request, optionally calling chain.next() to continue.
     *
     * @param request the incoming HTTP request
     * @param chain   the middleware chain — call chain.next(request) to continue
     * @return the HTTP response (either from chain.next() or created by this middleware)
     */
    HttpResponse handle(HttpRequest request, MiddlewareChain chain);
}
