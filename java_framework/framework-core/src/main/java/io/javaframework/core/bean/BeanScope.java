package io.javaframework.core.bean;

/**
 * Constants for bean scope identifiers.
 *
 * <h2>Why constants instead of an enum?</h2>
 * Enums have fixed values known at compile time. Scopes must be extensible —
 * a user might register a custom "thread" scope or "connection" scope.
 * Using String constants allows this. Spring follows the same pattern:
 * {@code ConfigurableBeanFactory.SCOPE_SINGLETON = "singleton"}.
 *
 * @see io.javaframework.core.annotation.Scope
 * @see BeanDefinition
 */
public final class BeanScope {

    /** One instance per container. This is the default and most common scope. */
    public static final String SINGLETON = "singleton";

    /** New instance created every time the bean is requested from the container. */
    public static final String PROTOTYPE = "prototype";

    /**
     * New instance per HTTP request.
     * Available only in web-enabled contexts. Added in Phase 3.
     */
    public static final String REQUEST = "request";

    /**
     * New instance per HTTP session.
     * Available only in web-enabled contexts. Added in Phase 3.
     */
    public static final String SESSION = "session";

    // Prevent instantiation — this is a constants class
    private BeanScope() {
        throw new UnsupportedOperationException("BeanScope is a constants class");
    }
}
