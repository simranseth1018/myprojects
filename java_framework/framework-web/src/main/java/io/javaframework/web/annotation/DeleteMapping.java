package io.javaframework.web.annotation;

import java.lang.annotation.*;

/**
 * Maps HTTP DELETE requests — for resource deletion (idempotent).
 *
 * @see GetMapping
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface DeleteMapping {
    String value() default "";
}
