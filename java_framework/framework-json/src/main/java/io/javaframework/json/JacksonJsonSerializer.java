package io.javaframework.json;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Jackson-based JSON serializer implementation.
 *
 * <h2>Jackson ObjectMapper:</h2>
 * ObjectMapper is the central Jackson class. It's thread-safe after configuration.
 * We create ONE shared instance and reuse it everywhere — this is the Jackson
 * best practice (creating ObjectMapper is expensive).
 *
 * <h2>Important configuration choices explained:</h2>
 *
 * <h3>FAIL_ON_UNKNOWN_PROPERTIES = false:</h3>
 * When deserializing JSON, if the JSON has fields that don't exist in the
 * Java class, Jackson normally throws an exception.
 * Setting this to false makes it ignore unknown fields — much better for
 * API evolution (you can add fields to JSON without breaking old clients).
 *
 * <h3>WRITE_DATES_AS_TIMESTAMPS = false:</h3>
 * Java's LocalDate/LocalDateTime default Jackson output: [2024, 1, 15] (array).
 * With this disabled: "2024-01-15" (ISO 8601 string) — much more human-readable
 * and standard in REST APIs.
 *
 * <h3>NON_NULL inclusion:</h3>
 * Don't serialize null fields in output.
 * {"name": "John", "email": null} → {"name": "John"}
 * Keeps JSON cleaner and reduces payload size.
 *
 * <h2>Jackson internals — how serialization works:</h2>
 * 1. ObjectMapper asks SerializerProvider for a serializer for the class
 * 2. SerializerProvider uses introspection (reflection) to find fields/getters
 * 3. Creates a BeanSerializer that stores an array of BeanPropertyWriter
 * 4. Each BeanPropertyWriter knows how to access and serialize one field
 * 5. These serializers are CACHED — very fast after the first use
 *
 * <h2>Performance:</h2>
 * First serialization of a class type: slow (reflection + cache building)
 * Subsequent serializations: fast (cached serializer, no reflection)
 * This is why it's important to reuse the ObjectMapper instance.
 *
 * @see JsonSerializer
 */
public class JacksonJsonSerializer implements JsonSerializer {

    private static final Logger log = LoggerFactory.getLogger(JacksonJsonSerializer.class);

    /**
     * The singleton ObjectMapper instance.
     *
     * <p>Thread-safe: ObjectMapper is safe for concurrent use after configuration.
     * Never reconfigure it after first use — that is NOT thread-safe.
     */
    private final ObjectMapper objectMapper;

    public JacksonJsonSerializer() {
        this.objectMapper = createObjectMapper();
    }

    /**
     * Constructor that accepts a pre-configured ObjectMapper.
     *
     * <p>Use this when you need custom configuration:
     * <pre>{@code
     *   ObjectMapper mapper = new ObjectMapper()
     *       .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
     *       .setPropertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE);
     *
     *   JacksonJsonSerializer serializer = new JacksonJsonSerializer(mapper);
     * }</pre>
     */
    public JacksonJsonSerializer(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public String serialize(Object object) {
        if (object == null) {
            return "null";
        }

        try {
            return objectMapper.writeValueAsString(object);
        } catch (Exception e) {
            log.error("Failed to serialize object of type: {}", object.getClass().getName(), e);
            throw new JsonSerializationException(
                "Failed to serialize " + object.getClass().getSimpleName(), e);
        }
    }

    @Override
    public <T> T deserialize(String json, Class<T> targetType) {
        if (json == null || json.isBlank()) {
            return null;
        }

        try {
            return objectMapper.readValue(json, targetType);
        } catch (Exception e) {
            log.error("Failed to deserialize JSON to type: {}", targetType.getName(), e);
            throw new JsonSerializationException(
                "Failed to deserialize JSON to " + targetType.getSimpleName(), e);
        }
    }

    /**
     * Creates and configures the ObjectMapper with sensible defaults for a REST API framework.
     */
    private static ObjectMapper createObjectMapper() {
        ObjectMapper mapper = new ObjectMapper();

        // ── Date/Time handling ─────────────────────────────────────────────────
        // Support Java 8+ date/time types (LocalDate, LocalDateTime, Instant, etc.)
        mapper.registerModule(new JavaTimeModule());
        // Don't write dates as numeric timestamps — use ISO 8601 strings
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        // ── Deserialization ────────────────────────────────────────────────────
        // Ignore unknown JSON fields — critical for API versioning
        mapper.disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);
        // Convert empty strings to null for Optional/String fields
        mapper.enable(DeserializationFeature.ACCEPT_EMPTY_STRING_AS_NULL_OBJECT);

        // ── Serialization ──────────────────────────────────────────────────────
        // Don't fail if there are no properties to serialize (empty beans)
        mapper.disable(SerializationFeature.FAIL_ON_EMPTY_BEANS);
        // Omit null fields from output
        mapper.setSerializationInclusion(JsonInclude.Include.NON_NULL);

        return mapper;
    }

    /**
     * Returns the underlying ObjectMapper for advanced usage.
     *
     * <p>Useful when you need to register custom modules or configure specific types.
     *
     * @return the ObjectMapper
     */
    public ObjectMapper getObjectMapper() {
        return objectMapper;
    }
}
