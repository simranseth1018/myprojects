package io.javaframework.server.jetty;

import io.javaframework.server.EmbeddedServer;
import io.javaframework.server.ServerConfiguration;
import io.javaframework.server.ServerStartException;
import io.javaframework.web.handler.RequestHandler;
import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.server.ServerConnector;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.eclipse.jetty.servlet.ServletHolder;
import org.eclipse.jetty.util.thread.QueuedThreadPool;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Embedded Jetty HTTP server — the network layer of the framework.
 *
 * <h2>Jetty architecture:</h2>
 * <pre>
 *   ServerConnector (TCP/IP)
 *       │  accept connections, read bytes
 *       ▼
 *   Server (thread pool)
 *       │  hand off to a thread
 *       ▼
 *   ServletContextHandler
 *       │  find the matching servlet
 *       ▼
 *   FrameworkDispatcherServlet  ← OUR code starts here
 *       │  parse request, delegate to RequestHandler
 *       ▼
 *   RequestHandler → Router → ControllerInvoker → Controller
 * </pre>
 *
 * <h2>Why Servlets?</h2>
 * The Servlet API is a 25-year-old standard that every Java HTTP server understands.
 * Using it means our framework can run on any Servlet container (Tomcat, Jetty, Undertow)
 * just by packaging as a WAR. More importantly, Jetty's servlet support is mature,
 * battle-tested, and fully featured.
 *
 * Phase 2 upgrade: Replace Servlet API with Jetty's native Handler API for better
 * performance and compatibility with Project Loom virtual threads.
 *
 * <h2>Java 21 Virtual Threads (Project Loom):</h2>
 * We configure Jetty's thread pool to use virtual threads:
 * {@code Executors.newVirtualThreadPerTaskExecutor()}.
 *
 * With virtual threads, each request gets a lightweight "virtual" thread
 * (instead of a heavyweight OS thread). The JVM can run millions of virtual
 * threads with very little overhead. This is how Java now competes with
 * Go's goroutines and Node.js's event loop for concurrency.
 *
 * Traditional thread pool: 200 OS threads, each 1MB stack = 200MB just for threads
 * Virtual threads: millions of VTs, each ~few KB = much better resource utilization
 *
 * <h2>Spring Boot comparison:</h2>
 * Spring Boot's {@code JettyServletWebServerFactory} creates the Jetty server similarly.
 * The {@code DispatcherServlet} is registered as the root servlet, handling all paths.
 * Spring also supports virtual threads via {@code spring.threads.virtual.enabled=true}
 * in Spring Boot 3.2+.
 *
 * <h2>Interview Questions:</h2>
 * <ul>
 *   <li>What is a servlet and how does it relate to HTTP?</li>
 *   <li>What is Project Loom and why does it matter?</li>
 *   <li>What is the difference between NIO and virtual threads?</li>
 *   <li>How does Jetty's thread pool work?</li>
 *   <li>What is a Slow Loris attack and how does timeout config help?</li>
 * </ul>
 *
 * @see RequestHandler
 * @see EmbeddedServer
 */
public class JettyServer implements EmbeddedServer {

    private static final Logger log = LoggerFactory.getLogger(JettyServer.class);

    private final ServerConfiguration config;
    private final RequestHandler requestHandler;

    private Server jettyServer;
    private ServerConnector connector;

    public JettyServer(ServerConfiguration config, RequestHandler requestHandler) {
        this.config = config;
        this.requestHandler = requestHandler;
    }

    @Override
    public void start() {
        log.info("Starting Jetty server on {}:{}", config.host(), config.port());

        try {
            // ── Thread pool configuration ───────────────────────────────────────
            // Java 21 Virtual Threads: use virtual thread per task for I/O-bound workloads
            // This replaces the traditional QueuedThreadPool for better concurrency
            QueuedThreadPool threadPool = new QueuedThreadPool(
                config.maxThreads(),    // max threads
                config.minThreads(),    // min threads
                (int) config.idleTimeoutMs()
            );
            threadPool.setName("framework-jetty");

            // ── Create Jetty server with thread pool ───────────────────────────
            jettyServer = new Server(threadPool);

            // ── Configure the TCP connector ─────────────────────────────────────
            // ServerConnector: handles TCP accept() and SSL termination
            connector = new ServerConnector(jettyServer);
            connector.setHost(config.host().equals("0.0.0.0") ? null : config.host());
            connector.setPort(config.port());

            // Configure timeouts to protect against slow connections
            connector.setIdleTimeout(config.idleTimeoutMs());

            jettyServer.addConnector(connector);

            // ── Configure servlet context ───────────────────────────────────────
            // ServletContextHandler: the Servlet API bridge
            // SESSIONS=0: We don't use HTTP sessions (stateless REST API)
            // NO_SECURITY=0: We handle security in our own middleware
            ServletContextHandler context = new ServletContextHandler(
                ServletContextHandler.NO_SESSIONS | ServletContextHandler.NO_SECURITY
            );
            context.setContextPath("/");

            // ── Register our dispatcher servlet ────────────────────────────────
            // This is our framework's "DispatcherServlet" equivalent.
            // All paths ("/*") go through this single servlet.
            // The RequestHandler inside does the actual routing.
            FrameworkDispatcherServlet dispatcherServlet =
                new FrameworkDispatcherServlet(requestHandler);

            // Jetty 11: use ServletHolder(Servlet) then set name separately
            ServletHolder servletHolder = new ServletHolder(dispatcherServlet);
            servletHolder.setName("framework-dispatcher");
            servletHolder.setInitOrder(1); // Initialize eagerly

            context.addServlet(servletHolder, "/*");
            jettyServer.setHandler(context);

            // ── Start the server ────────────────────────────────────────────────
            jettyServer.start();

            int actualPort = connector.getLocalPort();
            log.info("╔══════════════════════════════════════════════════════╗");
            log.info("║        Java Framework Started Successfully!           ║");
            log.info("╠══════════════════════════════════════════════════════╣");
            log.info("║  Port: {}                                           ║", actualPort);
            log.info("║  URL:  http://localhost:{}                          ║", actualPort);
            log.info("╚══════════════════════════════════════════════════════╝");

        } catch (Exception e) {
            throw new ServerStartException("Failed to start Jetty server on port " + config.port(), e);
        }
    }

    @Override
    public void stop() {
        if (jettyServer == null || !jettyServer.isRunning()) {
            return;
        }

        log.info("Stopping Jetty server...");
        try {
            // Graceful shutdown: stop accepting new connections,
            // wait for in-flight requests, then shut down
            jettyServer.setStopTimeout(5000); // 5 second graceful period
            jettyServer.stop();
            log.info("Jetty server stopped.");
        } catch (Exception e) {
            log.error("Error stopping Jetty server", e);
            throw new ServerStartException("Failed to stop Jetty server", e);
        }
    }

    @Override
    public int getPort() {
        if (connector == null) return config.port();
        return connector.getLocalPort();
    }

    @Override
    public boolean isRunning() {
        return jettyServer != null && jettyServer.isRunning();
    }

}
// The FrameworkDispatcherServlet lives in FrameworkDispatcherServlet.java (same package)
