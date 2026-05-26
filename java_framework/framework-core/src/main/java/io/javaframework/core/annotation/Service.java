package io.javaframework.core.annotation;

import java.lang.annotation.*;

/**
 * Marks a class as a Service — the business logic layer.
 *
 * <h2>The Three-Layer Architecture:</h2>
 * Enterprise Java applications are typically organized in three layers:
 *
 * <pre>
 *   ┌─────────────────────────────────────────┐
 *   │  @Controller  (Presentation Layer)      │ ← Handles HTTP, validates input
 *   ├─────────────────────────────────────────┤
 *   │  @Service     (Business Logic Layer)    │ ← Orchestrates business rules
 *   ├─────────────────────────────────────────┤
 *   │  @Repository  (Data Access Layer)       │ ← DB queries, persistence
 *   └─────────────────────────────────────────┘
 * </pre>
 *
 * Each layer depends only on the layer below it, never above.
 * This is the "Layered Architecture" pattern (also called N-tier architecture).
 *
 * <h2>Why separate Service from Controller?</h2>
 * <ul>
 *   <li><b>Testability:</b> You can unit-test business logic without spinning up HTTP.</li>
 *   <li><b>Reusability:</b> A service can be called by REST controllers, gRPC handlers,
 *       scheduled jobs, CLI commands, etc.</li>
 *   <li><b>Transaction boundaries:</b> In Spring, @Transactional is typically on services
 *       because a business operation may span multiple repository calls.</li>
 *   <li><b>Separation of concerns:</b> HTTP wiring is NOT business logic.</li>
 * </ul>
 *
 * <h2>Spring comparison:</h2>
 * In Spring, @Service is functionally identical to @Component — it's a pure
 * stereotype annotation for semantic clarity. Spring's AOP proxies (for
 * @Transactional, @Async, @Cacheable) are applied to any @Component including @Service.
 *
 * <h2>Future: Transaction support</h2>
 * In Phase 4, we'll support @Transactional on @Service methods. This requires
 * generating a proxy class (using CGLIB or ByteBuddy) that wraps the method
 * call in begin/commit/rollback logic. Spring does this with JDK dynamic proxies
 * (for interfaces) and CGLIB subclass proxies (for concrete classes).
 *
 * @see Component
 * @see Repository
 * @see Controller
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Component  // Services ARE components — they live in the IoC container
public @interface Service {

    /**
     * The bean name override.
     *
     * @return the explicit bean name, or empty for default name derivation
     */
    String value() default "";
}
