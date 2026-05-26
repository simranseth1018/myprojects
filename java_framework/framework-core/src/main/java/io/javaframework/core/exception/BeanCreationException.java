package io.javaframework.core.exception;

/**
 * Thrown when the IoC container fails to create a bean.
 *
 * <h2>Common causes:</h2>
 * <ul>
 *   <li>Constructor throws an exception during bean instantiation</li>
 *   <li>@PostConstruct method fails</li>
 *   <li>InitializingBean.afterPropertiesSet() fails</li>
 *   <li>Dependency injection fails (e.g., wrong type)</li>
 *   <li>No suitable constructor found</li>
 * </ul>
 *
 * <h2>Why extends RuntimeException?</h2>
 * Bean creation failures are programmer errors (wiring bugs, missing beans).
 * They're not recoverable at runtime — the application shouldn't continue
 * if its DI container is broken. Using RuntimeException forces the JVM
 * to propagate it up the call stack naturally.
 *
 * Spring's BeanCreationException is also a RuntimeException.
 */
public class BeanCreationException extends RuntimeException {

    private final String beanName;

    public BeanCreationException(String beanName, String message) {
        super("Failed to create bean '%s': %s".formatted(beanName, message));
        this.beanName = beanName;
    }

    public BeanCreationException(String beanName, String message, Throwable cause) {
        super("Failed to create bean '%s': %s".formatted(beanName, message), cause);
        this.beanName = beanName;
    }

    public String getBeanName() {
        return beanName;
    }
}
