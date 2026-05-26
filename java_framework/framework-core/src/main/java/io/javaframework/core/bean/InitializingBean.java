package io.javaframework.core.bean;

/**
 * Interface for beans that need programmatic initialization after property injection.
 *
 * <h2>@PostConstruct vs InitializingBean:</h2>
 * Both accomplish the same goal: run logic after injection.
 *
 * {@code @PostConstruct} (annotation-based):
 * - Clean: no framework coupling in your code
 * - The bean doesn't need to implement any interface
 * - Recommended for application code
 *
 * {@code InitializingBean} (interface-based):
 * - Couples your class to the framework API
 * - Useful for framework-internal beans that WANT the coupling
 * - Allows the compiler to enforce the method signature
 *
 * Spring supports both — if a bean has @PostConstruct AND implements InitializingBean,
 * @PostConstruct fires first, then afterPropertiesSet().
 *
 * <h2>When to use InitializingBean:</h2>
 * Framework-internal components (like our Router, BeanFactory itself, etc.)
 * can implement this interface for their setup logic.
 * Application developers should prefer @PostConstruct.
 *
 * @see DisposableBean
 * @see io.javaframework.core.annotation.PostConstruct
 */
@FunctionalInterface
public interface InitializingBean {

    /**
     * Called by the container after all properties have been set.
     *
     * <p>Implementations may throw any exception to signal initialization failure.
     * The container will propagate it as a {@code BeanCreationException}.
     *
     * @throws Exception if initialization fails
     */
    void afterPropertiesSet() throws Exception;
}
