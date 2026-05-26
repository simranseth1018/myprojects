package io.javaframework.web.annotation;

import java.lang.annotation.*;

/**
 * Binds the HTTP request body to a method parameter via JSON deserialization.
 *
 * <h2>How it works:</h2>
 * <pre>{@code
 *   @PostMapping("/users")
 *   public User createUser(@RequestBody CreateUserRequest request) { ... }
 * }</pre>
 *
 * When the request arrives:
 * 1. ControllerInvoker reads the raw request body as a String
 * 2. It finds the parameter annotated with @RequestBody
 * 3. It uses JsonSerializer.deserialize(bodyString, CreateUserRequest.class) to parse
 * 4. The resulting object is passed to the controller method
 *
 * <h2>Spring internals:</h2>
 * Spring uses {@code RequestResponseBodyMethodProcessor} which delegates to
 * the registered {@code HttpMessageConverter} list. The first converter
 * that supports the content type (e.g., application/json) does the conversion.
 * For JSON: {@code MappingJackson2HttpMessageConverter} is used.
 *
 * <h2>Validation:</h2>
 * In Phase 3, adding @Valid to the @RequestBody parameter will trigger
 * bean validation before the method body runs.
 *
 * @see RequestParam
 * @see PathVariable
 */
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface RequestBody {

    /**
     * Whether body presence is required.
     *
     * <p>If true (default), a 400 Bad Request is returned if the body is missing.
     * If false, the parameter will be null for missing bodies.
     *
     * @return true if the body is required
     */
    boolean required() default true;
}
