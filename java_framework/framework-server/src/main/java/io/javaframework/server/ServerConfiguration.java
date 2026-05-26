package io.javaframework.server;

/**
 * Configuration for the embedded HTTP server.
 *
 * <h2>Java 16+ Records:</h2>
 * Records are perfect for immutable configuration objects.
 * The compiler auto-generates: constructor, getters, equals(), hashCode(), toString().
 *
 * <h2>Spring Boot equivalent:</h2>
 * Spring Boot uses {@code server.port}, {@code server.address} etc. in
 * application.properties, bound to {@code ServerProperties} via @ConfigurationProperties.
 * We start simpler and add properties file support in Phase 3.
 */
public record ServerConfiguration(
    /** The TCP port to listen on. Default: 8080. */
    int port,

    /** The host/interface to bind to. Default: "0.0.0.0" (all interfaces). */
    String host,

    /** Maximum number of concurrent request handler threads. */
    int maxThreads,

    /** Minimum number of threads in the pool. */
    int minThreads,

    /**
     * Thread idle timeout in milliseconds.
     * Threads idle longer than this are terminated (pool shrinks to minThreads).
     */
    long idleTimeoutMs,

    /**
     * Request read timeout in milliseconds.
     * Prevents slow-loris attacks (clients sending data very slowly).
     */
    long requestTimeoutMs
) {

    /**
     * Default configuration suitable for development.
     */
    public static ServerConfiguration defaultConfig() {
        return new ServerConfiguration(
            8080,           // port
            "0.0.0.0",     // host — bind to all interfaces
            200,            // maxThreads — Jetty's default
            8,              // minThreads
            60_000,         // idleTimeoutMs — 1 minute
            30_000          // requestTimeoutMs — 30 seconds
        );
    }

    /**
     * Creates a configuration with a custom port.
     */
    public static ServerConfiguration onPort(int port) {
        ServerConfiguration defaults = defaultConfig();
        return new ServerConfiguration(
            port, defaults.host(), defaults.maxThreads(),
            defaults.minThreads(), defaults.idleTimeoutMs(), defaults.requestTimeoutMs()
        );
    }

    /**
     * Returns a new configuration with the given port.
     * (withXxx pattern for record modification)
     */
    public ServerConfiguration withPort(int newPort) {
        return new ServerConfiguration(newPort, host, maxThreads, minThreads,
            idleTimeoutMs, requestTimeoutMs);
    }
}
