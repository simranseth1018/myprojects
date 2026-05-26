package io.javaframework.server;

/**
 * Thrown when the embedded server fails to start or stop.
 */
public class ServerStartException extends RuntimeException {

    public ServerStartException(String message, Throwable cause) {
        super(message, cause);
    }

    public ServerStartException(String message) {
        super(message);
    }
}
