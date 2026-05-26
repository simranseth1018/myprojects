package io.javaframework.json;

/**
 * Abstraction for JSON serialization and deserialization.
 *
 * <h2>Why an interface?</h2>
 * This follows the "Dependency Inversion Principle" — high-level modules
 * (ControllerInvoker, RequestHandler) depend on this abstraction, not on
 * Jackson's concrete classes. If you want to swap Jackson for Gson or Moshi:
 * 1. Create GsonSerializer implements JsonSerializer
 * 2. Register it in your application context
 * No other changes needed.
 *
 * <h2>Spring equivalent:</h2>
 * Spring uses {@code HttpMessageConverter<T>} as a more general abstraction
 * (handles any media type, not just JSON). The JSON converter is
 * {@code MappingJackson2HttpMessageConverter}.
 *
 * @see JacksonJsonSerializer
 */
public interface JsonSerializer {

    /**
     * Serializes an object to its JSON string representation.
     *
     * @param object the object to serialize (may be null → "null")
     * @return the JSON string
     * @throws JsonSerializationException if serialization fails
     */
    String serialize(Object object);

    /**
     * Deserializes a JSON string into an object of the given type.
     *
     * @param json        the JSON string
     * @param targetType  the target class
     * @param <T>         the type parameter
     * @return the deserialized object
     * @throws JsonSerializationException if deserialization fails
     */
    <T> T deserialize(String json, Class<T> targetType);
}
