package io.javaframework.core.annotation;

import java.lang.annotation.*;

/**
 * Defines the bean's lifecycle scope within the IoC container.
 *
 * <h2>Bean Scopes:</h2>
 *
 * <h3>SINGLETON (default)</h3>
 * One instance per container. Created once, reused forever.
 * <pre>{@code
 *   @Service // singleton by default
 *   class UserService { ... }
 * }</pre>
 * Use for: stateless services, repositories, controllers.
 * Thread safety: your responsibility — if multiple threads call the same
 * instance concurrently, shared mutable state is a problem.
 *
 * <h3>PROTOTYPE</h3>
 * New instance created every time the bean is requested.
 * <pre>{@code
 *   @Component
 *   @Scope("prototype")
 *   class RequestContext { ... }
 * }</pre>
 * Use for: stateful objects, command objects, builders.
 * Note: the container creates it but does NOT manage its destruction.
 * You own the lifecycle once you have the instance.
 *
 * <h3>REQUEST (web scope — Phase 3)</h3>
 * New instance per HTTP request. Stored in request attributes.
 * <pre>{@code
 *   @Component
 *   @Scope("request")
 *   class RequestContext { ... }
 * }</pre>
 *
 * <h3>SESSION (web scope — Phase 3)</h3>
 * New instance per HTTP session.
 *
 * <h2>Spring internals — how scopes are implemented:</h2>
 * Spring has a {@code Scope} interface. Each scope type registers a
 * {@code Scope} implementation with the factory:
 * - SingletonScope: stores bean in a ConcurrentHashMap
 * - PrototypeScope: creates a new instance on every getBean() call
 * - RequestScope: stores bean in HttpServletRequest attributes
 * - SessionScope: stores bean in HttpSession
 *
 * For prototype beans injected into singletons, Spring uses "scoped proxies" —
 * a proxy object that delegates to the correct instance each time a method is called.
 *
 * <h2>Our implementation:</h2>
 * Our DefaultBeanFactory checks BeanDefinition.getScope() on every getBean() call.
 * Singletons are cached in a Map; prototypes create a new instance each time.
 *
 * @see io.javaframework.core.bean.BeanDefinition
 * @see io.javaframework.core.bean.BeanScope
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface Scope {

    /**
     * The scope identifier.
     *
     * <p>Standard values: {@code "singleton"}, {@code "prototype"},
     * {@code "request"}, {@code "session"}.
     *
     * <p>Use {@code BeanScope.SINGLETON} and {@code BeanScope.PROTOTYPE}
     * constants to avoid typos.
     *
     * @return the scope identifier string
     */
    String value() default "singleton";
}
