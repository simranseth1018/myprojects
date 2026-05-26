package io.javaframework.web.annotation;

import java.lang.annotation.*;

/**
 * Binds a URL path segment to a method parameter.
 *
 * <h2>How path variables work:</h2>
 * Given the route {@code /users/{id}} and request {@code GET /users/42}:
 * <ul>
 *   <li>The Router extracts {@code id=42} from the URL</li>
 *   <li>ControllerInvoker finds the method parameter annotated with @PathVariable("id")</li>
 *   <li>It converts "42" (String) to Long using TypeConverters</li>
 *   <li>It passes 42L as the argument to the controller method</li>
 * </ul>
 *
 * <pre>{@code
 *   @GetMapping("/users/{id}")
 *   public User getUser(@PathVariable Long id) { ... }
 *
 *   @GetMapping("/users/{userId}/orders/{orderId}")
 *   public Order getOrder(@PathVariable Long userId, @PathVariable Long orderId) { ... }
 * }</pre>
 *
 * <h2>Type conversion:</h2>
 * The path variable is always extracted as a String.
 * We convert it to the parameter type using a registry of converters:
 * String → Long, String → Integer, String → Boolean, String → UUID, etc.
 *
 * Spring uses {@code ConversionService} for this, backed by
 * {@code DefaultConversionService} with built-in converters.
 *
 * <h2>WHY -parameters compiler flag?</h2>
 * When you use {@code @PathVariable} without specifying the name:
 * {@code @PathVariable Long id} — the framework needs to know the parameter
 * is named "id" to match it against the {id} in the URL.
 *
 * By default, Java erases parameter names in bytecode!
 * The {@code -parameters} compiler flag preserves them in the .class file.
 * Without it, you must always write {@code @PathVariable("id") Long id}.
 * Spring Boot's build plugins automatically add -parameters.
 *
 * @see GetMapping
 * @see RequestParam
 * @see RequestBody
 */
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface PathVariable {

    /**
     * The name of the path variable to bind.
     *
     * <p>If empty, the parameter name is used (requires -parameters compiler flag).
     *
     * @return the path variable name
     */
    String value() default "";
}
