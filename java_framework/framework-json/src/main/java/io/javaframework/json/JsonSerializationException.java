package io.javaframework.json;

/**
 * Thrown when JSON serialization or deserialization fails.
 */
public class JsonSerializationException extends RuntimeException {

    public JsonSerializationException(String message, Throwable cause) {
        super(message, cause);
    }
}
