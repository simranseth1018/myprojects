package io.javaframework.server.jetty;

import io.javaframework.web.handler.RequestHandler;
import io.javaframework.web.http.HttpRequest;
import io.javaframework.web.http.HttpResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * The framework's "DispatcherServlet" — receives ALL HTTP requests from Jetty
 * and delegates them to the framework's RequestHandler.
 *
 * <h2>Design note:</h2>
 * This is the single entry point for all HTTP traffic.
 * It adapts Jetty's Servlet API to our framework's HttpRequest/HttpResponse model.
 *
 * <h2>Thread safety:</h2>
 * HttpServlet.service() is called by multiple threads concurrently.
 * This servlet is stateless (all state is in RequestHandler, which is thread-safe).
 *
 * <h2>Spring DispatcherServlet comparison:</h2>
 * Spring's DispatcherServlet extends HttpServlet, overrides service(), and delegates
 * to its HandlerMapping + HandlerAdapter infrastructure.
 * Ours does the same but routes through our RequestHandler + Router.
 *
 * @see RequestHandler
 */
class FrameworkDispatcherServlet extends HttpServlet {

    private static final Logger log = LoggerFactory.getLogger(FrameworkDispatcherServlet.class);

    private final RequestHandler requestHandler;

    FrameworkDispatcherServlet(RequestHandler requestHandler) {
        this.requestHandler = requestHandler;
    }

    @Override
    protected void service(HttpServletRequest servletRequest,
                           HttpServletResponse servletResponse) throws IOException {
        try {
            // ── Adapt: Servlet API → Framework model ──────────────────────────
            HttpRequest request = HttpRequest.from(servletRequest);

            // ── Process through middleware chain → controller ──────────────────
            HttpResponse response = requestHandler.handle(request);

            // ── Write response back to servlet ─────────────────────────────────
            response.writeTo(servletResponse);

        } catch (Exception e) {
            // Last-resort error handler — should rarely reach here
            // because RequestHandler catches most exceptions internally
            log.error("Unhandled exception at servlet level", e);

            if (!servletResponse.isCommitted()) {
                servletResponse.setStatus(500);
                servletResponse.setContentType("application/json");
                servletResponse.getWriter().write(
                    "{\"error\": \"Internal Server Error\", \"status\": 500}"
                );
            }
        }
    }
}
