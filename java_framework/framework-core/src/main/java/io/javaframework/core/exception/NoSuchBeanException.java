package io.javaframework.core.exception;

/**
 * Thrown when a requested bean is not found in the IoC container.
 *
 * <h2>When does this happen?</h2>
 * <ul>
 *   <li>getBean("userService") but "userService" was never registered</li>
 *   <li>getBean(UserService.class) but no @Service-annotated UserService exists</li>
 *   <li>@Autowired UserService service — but UserService isn't on the classpath</li>
 * </ul>
 *
 * <h2>Debugging tip:</h2>
 * Always check:
 * 1. Is the class annotated with @Component/@Service/@Controller/@Repository?
 * 2. Is the class in a package that was included in the scan?
 * 3. Is there a spelling mismatch in the bean name?
 */
public class NoSuchBeanException extends RuntimeException {

    public NoSuchBeanException(String beanName) {
        super("No bean named '%s' found in the container".formatted(beanName));
    }

    public NoSuchBeanException(Class<?> beanType) {
        super("No bean of type '%s' found in the container".formatted(beanType.getName()));
    }

    public NoSuchBeanException(Class<?> beanType, String message) {
        super("No bean of type '%s' found: %s".formatted(beanType.getName(), message));
    }
}
