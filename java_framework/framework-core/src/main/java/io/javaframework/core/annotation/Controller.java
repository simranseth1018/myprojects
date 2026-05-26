package io.javaframework.core.annotation;

import java.lang.annotation.*;

/**
 * Marks a class as a Web Controller — a component that handles HTTP requests.
 *
 * <h2>Role in the framework:</h2>
 * <ol>
 *   <li>The IoC container creates and manages the controller as a singleton bean
 *       (because @Controller is meta-annotated with @Component).</li>
 *   <li>The web layer scans for @Controller classes and registers their
 *       @GetMapping/@PostMapping methods as route handlers in the Router.</li>
 * </ol>
 *
 * <h2>Spring comparison:</h2>
 * Spring has two controller annotations:
 * <ul>
 *   <li>{@code @Controller} — traditional MVC, methods return view names (Thymeleaf, JSP)</li>
 *   <li>{@code @RestController} — REST APIs, methods return response body directly.
 *       Internally @RestController = @Controller + @ResponseBody.</li>
 * </ul>
 *
 * In our framework, @Controller always implies REST (like @RestController),
 * because we're building an API framework, not a full MVC framework.
 * We may add @ViewController later for template support.
 *
 * <h2>Architecture note — why controllers are singletons:</h2>
 * Controllers handle requests but should be STATELESS. Any shared state
 * (like a counter or session data) must live in the service layer or a database.
 * A single controller instance serves ALL concurrent requests via multiple threads.
 * This is why you should never store request-specific data in controller fields.
 *
 * <h2>Under the hood — request routing:</h2>
 * When a request arrives:
 * 1. DispatcherServlet passes it to the Router
 * 2. Router matches path+method against registered RouteDefinitions
 * 3. RouteDefinition holds a reference to the method AND the controller bean instance
 * 4. ControllerInvoker calls method.invoke(controllerBean, args...)
 * 5. Return value is serialized to JSON
 *
 * @see Component
 * @see io.javaframework.web.annotation.GetMapping
 * @see io.javaframework.web.annotation.PostMapping
 * @see io.javaframework.web.routing.Router
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Component  // Controllers ARE components — they get IoC-managed and injected
public @interface Controller {

    /**
     * Optional base path prefix for all routes in this controller.
     *
     * <p>Example: {@code @Controller("/api/v1/users")} means all methods'
     * paths are relative to {@code /api/v1/users}.
     *
     * @return the base path, or empty string for no prefix
     */
    String value() default "";
}
