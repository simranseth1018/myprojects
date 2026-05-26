package io.javaframework.web.annotation;

import java.lang.annotation.*;

/**
 * Maps HTTP POST requests to the annotated controller method.
 *
 * <h2>HTTP POST semantics:</h2>
 * POST is for CREATING resources or submitting data. It:
 * <ul>
 *   <li>Is NOT safe (modifies state)</li>
 *   <li>Is NOT idempotent (multiple requests may create duplicates)</li>
 *   <li>Is NOT cacheable by default</li>
 *   <li>Carries a request body (JSON, form data, multipart, etc.)</li>
 * </ul>
 *
 * <h2>Usage:</h2>
 * <pre>{@code
 *   @PostMapping("/users")
 *   public User createUser(@RequestBody CreateUserRequest request) {
 *       return userService.create(request);
 *   }
 * }</pre>
 *
 * <h2>Content-Type handling:</h2>
 * By default, our framework reads the request body as JSON.
 * Phase 3 will add content-type negotiation for other formats.
 *
 * @see GetMapping
 * @see RequestBody
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface PostMapping {

    /**
     * The URL path pattern.
     *
     * @return the path
     */
    String value() default "";
}
