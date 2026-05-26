package io.javaframework.server;

/**
 * Contract for an embedded HTTP server.
 *
 * <h2>Why an interface?</h2>
 * We might want to swap Jetty for:
 * - Undertow (used by WildFly, supports non-blocking IO)
 * - Netty (high-performance, NIO-based, used by Spring WebFlux)
 * - Helidon SE (Oracle's lightweight server)
 * - Simple (simple HTTP server from the JDK)
 *
 * With this interface, swapping servers is a one-file change.
 *
 * <h2>Spring Boot comparison:</h2>
 * Spring Boot's {@code WebServer} interface has the same purpose:
 * {@code start()}, {@code stop()}, {@code getPort()}.
 * Implementations: TomcatWebServer, JettyWebServer, UndertowWebServer.
 *
 * @see io.javaframework.server.jetty.JettyServer
 */
public interface EmbeddedServer {

    /**
     * Starts the server and begins accepting connections.
     *
     * @throws ServerStartException if the server fails to start
     *         (e.g., port already in use)
     */
    void start();

    /**
     * Gracefully stops the server.
     *
     * <p>Waits for in-flight requests to complete (up to a timeout),
     * then forcefully stops if they haven't finished.
     *
     * @throws ServerStartException if shutdown encounters an error
     */
    void stop();

    /**
     * Returns the actual port the server is listening on.
     *
     * <p>Useful when port 0 is configured (OS assigns a random available port),
     * common in tests: {@code new ServerConfiguration(0, ...)}
     *
     * @return the listening port
     */
    int getPort();

    /**
     * Returns true if the server is currently running.
     *
     * @return true if started and accepting connections
     */
    boolean isRunning();
}
