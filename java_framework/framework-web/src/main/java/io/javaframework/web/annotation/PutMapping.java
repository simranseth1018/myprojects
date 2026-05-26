package io.javaframework.web.annotation;

import java.lang.annotation.*;

/**
 * Maps HTTP PUT requests — for full resource replacement (idempotent).
 *
 * <h2>PUT vs PATCH:</h2>
 * <ul>
 *   <li>PUT: Replace the entire resource. Send all fields.</li>
 *   <li>PATCH: Partial update. Send only the fields to change.</li>
 * </ul>
 *
 * @see GetMapping
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface PutMapping {
    String value() default "";
}
