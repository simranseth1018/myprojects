package io.javaframework.core.annotation;

import java.lang.annotation.*;

/**
 * Disambiguates which bean to inject when multiple candidates exist.
 *
 * <h2>The multiple-bean problem:</h2>
 * <pre>{@code
 *   interface NotificationService { void send(String msg); }
 *
 *   @Service("emailNotification")
 *   class EmailNotificationService implements NotificationService { ... }
 *
 *   @Service("smsNotification")
 *   class SmsNotificationService implements NotificationService { ... }
 *
 *   @Service
 *   class OrderService {
 *       @Autowired
 *       @Qualifier("emailNotification")   // ← tells container WHICH one to inject
 *       private NotificationService notificationService;
 *   }
 * }</pre>
 *
 * <h2>Spring's resolution algorithm:</h2>
 * 1. If @Qualifier is present → match by bean name exactly
 * 2. If @Primary is on one bean → prefer it
 * 3. If parameter name matches a bean name → use it (requires -parameters compiler flag)
 * 4. Otherwise → NoUniqueBeanDefinitionException
 *
 * <h2>Our implementation:</h2>
 * In {@code DefaultBeanFactory.resolveBean()}, when multiple beans of the
 * required type are found, we check for @Qualifier and match by name.
 *
 * @see Autowired
 */
@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.CONSTRUCTOR})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface Qualifier {

    /**
     * The name of the bean to inject.
     *
     * <p>Must exactly match the bean's registered name in the container.
     *
     * @return the bean name to look up
     */
    String value();
}
