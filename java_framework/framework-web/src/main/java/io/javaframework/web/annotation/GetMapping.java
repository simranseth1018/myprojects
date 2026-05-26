package io.javaframework.web.annotation;

import java.lang.annotation.*;

/**
 * Maps HTTP GET requests to the annotated controller method.
 *
 * <h2>HTTP GET semantics:</h2>
 * GET is for READING resources. It must be:
 * <ul>
 *   <li><b>Safe:</b> Has no side effects (doesn't modify state)</li>
 *   <li><b>Idempotent:</b> Multiple identical requests produce the same result</li>
 *   <li><b>Cacheable:</b> Responses may be cached by browsers/proxies</li>
 * </ul>
 *
 * <h2>Usage:</h2>
 * <pre>{@code
 *   @Controller("/api/users")
 *   public class UserController {
 *
 *       @GetMapping                // Maps GET /api/users
 *       public List<User> getAll() { ... }
 *
 *       @GetMapping("/{id}")       // Maps GET /api/users/{id}
 *       public User getById(@PathVariable Long id) { ... }
 *
 *       @GetMapping("/search")     // Maps GET /api/users/search?name=John
 *       public List<User> search(@RequestParam String name) { ... }
 *   }
 * }</pre>
 *
 * <h2>Spring internals:</h2>
 * In Spring, @GetMapping is a composed annotation:
 * {@code @RequestMapping(method = RequestMethod.GET)}.
 * The {@code RequestMappingHandlerMapping} processes this at startup and
 * builds a {@code MappingRegistry} mapping path patterns to handler methods.
 *
 * We follow the same pattern: at startup, {@code ControllerRegistry} scans
 * all @Controller beans for @GetMapping methods and registers routes.
 *
 * @see PostMapping
 * @see PutMapping
 * @see DeleteMapping
 * @see PathVariable
 * @see RequestParam
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface GetMapping {

    /**
     * The URL path this method handles, relative to the controller's base path.
     *
     * <p>Supports:
     * <ul>
     *   <li>Literal paths: {@code "/users"}</li>
     *   <li>Path variables: {@code "/users/{id}"}</li>
     *   <li>Empty string: {@code ""} matches the controller's base path</li>
     * </ul>
     *
     * @return the path pattern
     */
    String value() default "";
}
