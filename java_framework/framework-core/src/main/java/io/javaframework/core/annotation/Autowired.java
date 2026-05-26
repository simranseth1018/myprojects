package io.javaframework.core.annotation;

import java.lang.annotation.*;

/**
 * Marks a constructor, field, or setter as a dependency injection point.
 *
 * <h2>What is Dependency Injection (DI)?</h2>
 * DI is the mechanism by which an object receives its dependencies from
 * an external system (the IoC container) rather than creating them itself.
 *
 * <h2>Three types of injection:</h2>
 *
 * <h3>1. Constructor Injection (PREFERRED)</h3>
 * <pre>{@code
 *   @Service
 *   public class OrderService {
 *       private final PaymentService paymentService;
 *
 *       @Autowired
 *       public OrderService(PaymentService paymentService) {
 *           this.paymentService = paymentService;
 *       }
 *   }
 * }</pre>
 * WHY IT'S BEST: Dependencies are final (immutable), clearly visible,
 * and testable without the IoC container (just call the constructor).
 * Spring 4.3+: @Autowired is optional on single-constructor classes.
 *
 * <h3>2. Field Injection (CONVENIENT BUT DISCOURAGED)</h3>
 * <pre>{@code
 *   @Service
 *   public class OrderService {
 *       @Autowired
 *       private PaymentService paymentService;
 *   }
 * }</pre>
 * WHY IT'S BAD: Fields are non-final, injection bypasses the constructor
 * (breaking immutability), and you can't write tests without reflection or
 * an IoC container. Spring uses {@code Field.setAccessible(true)} to inject,
 * which violates encapsulation.
 *
 * <h3>3. Setter Injection (FOR OPTIONAL DEPENDENCIES)</h3>
 * <pre>{@code
 *   @Service
 *   public class OrderService {
 *       private NotificationService notificationService;
 *
 *       @Autowired(required = false)
 *       public void setNotificationService(NotificationService svc) {
 *           this.notificationService = svc;
 *       }
 *   }
 * }</pre>
 * WHEN TO USE: For optional dependencies that have defaults.
 *
 * <h2>How Spring resolves @Autowired:</h2>
 * <ol>
 *   <li>Find all beans of the required type (byType matching)</li>
 *   <li>If exactly one: inject it</li>
 *   <li>If zero: throw NoSuchBeanDefinitionException (unless required=false)</li>
 *   <li>If multiple: use @Qualifier or @Primary to disambiguate</li>
 * </ol>
 *
 * <h2>Circular Dependency Problem:</h2>
 * If BeanA needs BeanB in its constructor, and BeanB needs BeanA,
 * you have a circular dependency — Spring throws BeanCurrentlyInCreationException.
 * Fix: redesign (extract shared logic), or use setter injection for one side.
 * Our container tracks "currently-being-created" beans to detect this early.
 *
 * <h2>Our implementation:</h2>
 * In {@code DefaultBeanFactory.inject()}, we:
 * 1. Look for @Autowired constructors → use them if found
 * 2. Else look for @Autowired fields → inject via reflection
 * 3. Else look for @Autowired setters → call them
 *
 * <h2>Reflection internals:</h2>
 * {@code constructor.setAccessible(true)} — tells JVM to bypass access checks.
 * {@code field.setAccessible(true)} — same for private fields.
 * In Java 9+, this may require {@code --add-opens} JVM args for modules.
 *
 * <h2>Interview Questions:</h2>
 * <ul>
 *   <li>What is the difference between @Autowired and @Inject?</li>
 *   <li>Why is constructor injection preferred over field injection?</li>
 *   <li>What happens when Spring finds multiple beans of the same type?</li>
 *   <li>What is a circular dependency and how do you resolve it?</li>
 *   <li>What is the difference between BeanFactory and ApplicationContext?</li>
 *   <li>How does Spring inject private fields using reflection?</li>
 * </ul>
 *
 * @see Qualifier
 * @see io.javaframework.core.bean.DefaultBeanFactory
 */
@Target({ElementType.CONSTRUCTOR, ElementType.FIELD, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface Autowired {

    /**
     * Whether this dependency is required.
     *
     * <p>If {@code true} (default), the container throws an exception if no
     * matching bean is found. If {@code false}, the field/parameter remains
     * null if no bean is found.
     *
     * <p>Equivalent to Spring's {@code @Autowired(required = false)}.
     *
     * @return true if the dependency must be present in the container
     */
    boolean required() default true;
}
