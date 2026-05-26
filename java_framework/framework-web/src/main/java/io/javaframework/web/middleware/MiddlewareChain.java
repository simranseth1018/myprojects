package io.javaframework.web.middleware;

import io.javaframework.web.http.HttpRequest;
import io.javaframework.web.http.HttpResponse;

import java.util.List;
import java.util.function.Function;

/**
 * Executes the middleware chain in order, ending with the controller handler.
 *
 * <h2>Implementation: Recursive chain using index</h2>
 * This is the "Chain of Responsibility" design pattern.
 *
 * Each time {@code next()} is called, we advance the index by 1.
 * When we reach the end of the middleware list, we call the final handler
 * (the controller method).
 *
 * <h2>How the chain executes:</h2>
 * <pre>
 *   chain = [LoggingMiddleware, AuthMiddleware, handler]
 *
 *   LoggingMiddleware.handle(req, chain):
 *     log "request received"
 *     response = chain.next(req)   // calls AuthMiddleware
 *     log "response sent"
 *     return response
 *
 *   AuthMiddleware.handle(req, chain):
 *     if not authenticated: return 401
 *     response = chain.next(req)   // calls handler
 *     return response
 *
 *   handler(req):                  // controller method
 *     return "Hello World"         // wrapped in 200 OK response
 * </pre>
 *
 * <h2>Immutability:</h2>
 * MiddlewareChain is immutable and stateless — you can share it across threads.
 * The "index" state is kept in a local stack-allocated MiddlewareChain.
 *
 * @see Middleware
 */
public class MiddlewareChain {

    private final List<Middleware> middlewares;
    private final Function<HttpRequest, HttpResponse> finalHandler;
    private final int index;

    /**
     * Creates the root of the middleware chain.
     *
     * @param middlewares  the list of middlewares to execute in order
     * @param finalHandler the terminal handler (controller invocation)
     */
    public MiddlewareChain(List<Middleware> middlewares,
                           Function<HttpRequest, HttpResponse> finalHandler) {
        this(middlewares, finalHandler, 0);
    }

    private MiddlewareChain(List<Middleware> middlewares,
                            Function<HttpRequest, HttpResponse> finalHandler,
                            int index) {
        this.middlewares = middlewares;
        this.finalHandler = finalHandler;
        this.index = index;
    }

    /**
     * Advances to the next step in the chain.
     *
     * <p>If there are more middlewares, calls the next one.
     * If we have reached the end, calls the final handler (controller).
     *
     * @param request the current request (may be modified by middleware)
     * @return the response from the next middleware or handler
     */
    public HttpResponse next(HttpRequest request) {
        if (index < middlewares.size()) {
            // There are more middlewares — advance the chain
            MiddlewareChain nextChain = new MiddlewareChain(middlewares, finalHandler, index + 1);
            return middlewares.get(index).handle(request, nextChain);
        } else {
            // Chain exhausted — call the final handler (controller)
            return finalHandler.apply(request);
        }
    }
}
