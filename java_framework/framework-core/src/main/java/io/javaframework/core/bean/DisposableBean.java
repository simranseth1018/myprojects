package io.javaframework.core.bean;

/**
 * Interface for beans that need cleanup on container shutdown.
 *
 * <p>Equivalent to Spring's {@code DisposableBean}. Called by the container
 * during graceful shutdown, after all @PreDestroy methods have been invoked.
 *
 * @see InitializingBean
 * @see io.javaframework.core.annotation.PreDestroy
 */
@FunctionalInterface
public interface DisposableBean {

    /**
     * Called by the container on shutdown to release resources.
     *
     * @throws Exception if cleanup fails (logged but does not prevent shutdown)
     */
    void destroy() throws Exception;
}
