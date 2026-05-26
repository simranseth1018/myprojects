package io.javaframework.core.annotation;

import java.lang.annotation.*;

/**
 * Marks a class as a Spring-like "bean" — a managed component in the IoC container.
 *
 * <h2>What is a Component?</h2>
 * A component is any class whose lifecycle (creation, dependency injection, destruction)
 * is managed by the framework's IoC container rather than by application code.
 *
 * Instead of:
 * <pre>{@code
 *   UserService service = new UserService(new UserRepository(new DataSource(...)));
 * }</pre>
 *
 * You do:
 * <pre>{@code
 *   @Component
 *   public class UserService { ... }
 * }</pre>
 * ...and the framework handles construction and wiring automatically.
 *
 * <h2>How Spring implements this:</h2>
 * In Spring, {@code @Component} is the root stereotype annotation.
 * Spring's {@code ClassPathScanningCandidateComponentProvider} scans bytecode
 * (using ASM, without class-loading) looking for this annotation.
 * Found classes are registered as {@code BeanDefinition} objects in the
 * {@code DefaultListableBeanFactory}.
 *
 * <h2>How WE implement this:</h2>
 * Our {@code ClassPathScannerImpl} uses the Reflections library to scan
 * for classes annotated with @Component (or its meta-annotated subtypes).
 * Found classes become {@code BeanDefinition} entries in our {@code DefaultBeanFactory}.
 *
 * <h2>Meta-annotation pattern:</h2>
 * Notice that @Controller, @Service, and @Repository are all annotated with @Component.
 * This is the "meta-annotation" pattern. A class annotated with @Service is
 * ALSO implicitly a @Component. Our scanner handles this via
 * {@code AnnotationUtils.isMetaAnnotated()}.
 *
 * <h2>JVM / Reflection internals:</h2>
 * Annotations in Java are stored as synthetic methods in the constant pool.
 * At runtime, {@code clazz.isAnnotationPresent(Component.class)} triggers the JVM
 * to look up the annotation descriptor from the class file header.
 * This is why {@code @Retention(RUNTIME)} is critical — without it, the JVM
 * strips the annotation during class loading and reflection can't find it.
 *
 * <h2>Interview Questions:</h2>
 * <ul>
 *   <li>What's the difference between @Component, @Service, @Repository, @Controller?</li>
 *   <li>What is a stereotype annotation?</li>
 *   <li>Why do we need @Retention(RUNTIME) on annotations used for reflection?</li>
 *   <li>How does Spring discover @Component classes without loading every class?</li>
 *   <li>What is classpath scanning and how does it work with the ClassLoader?</li>
 * </ul>
 *
 * @see Controller
 * @see Service
 * @see Repository
 * @see io.javaframework.core.bean.BeanDefinition
 * @see io.javaframework.core.scanner.ClassPathScanner
 */
@Target(ElementType.TYPE)           // Only valid on classes/interfaces
@Retention(RetentionPolicy.RUNTIME) // Must be RUNTIME for reflection-based scanning
@Documented                         // Appears in generated Javadoc
public @interface Component {

    /**
     * The logical name of this bean in the container.
     *
     * <p>If left empty (the default), the container uses the class's simple name
     * with its first character lowercased. For example, {@code UserService} becomes
     * {@code "userService"}.
     *
     * <p>Equivalent to Spring's {@code @Component("beanName")}.
     *
     * @return the bean name, or empty string to use the default name
     */
    String value() default "";
}
