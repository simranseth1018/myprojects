package io.javaframework.web.annotation;

import java.lang.annotation.*;

/**
 * Binds a URL query parameter to a method parameter.
 *
 * <h2>URL query parameters:</h2>
 * Given {@code GET /users/search?name=John&amp;age=30&amp;active=true}:
 *
 * <pre>{@code
 *   @GetMapping("/users/search")
 *   public List<User> search(
 *       @RequestParam String name,             // "John"
 *       @RequestParam(required = false) Integer age,  // 30 or null if absent
 *       @RequestParam(defaultValue = "true") boolean active  // true
 *   ) { ... }
 * }</pre>
 *
 * <h2>Multiple values for the same parameter:</h2>
 * {@code GET /users?role=admin&amp;role=user} (multi-value)
 * <pre>{@code
 *   @GetMapping("/users")
 *   public List<User> getByRoles(@RequestParam List<String> role) { ... }
 * }</pre>
 *
 * @see PathVariable
 * @see RequestBody
 */
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface RequestParam {

    /**
     * The name of the query parameter to bind.
     *
     * <p>If empty, uses the parameter name (requires -parameters flag).
     *
     * @return the query parameter name
     */
    String value() default "";

    /**
     * Whether this parameter is required.
     *
     * @return true if required (default)
     */
    boolean required() default true;

    /**
     * Default value if the parameter is absent.
     *
     * <p>Setting a default value makes the parameter optional regardless of {@code required}.
     *
     * @return the default value string
     */
    String defaultValue() default "";
}
