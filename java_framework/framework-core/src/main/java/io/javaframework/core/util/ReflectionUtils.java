package io.javaframework.core.util;

import io.javaframework.core.annotation.Autowired;
import io.javaframework.core.annotation.PostConstruct;
import io.javaframework.core.annotation.PreDestroy;

import java.lang.annotation.Annotation;
import java.lang.reflect.*;
import java.util.*;
import java.util.stream.Stream;

/**
 * Utility class for reflection operations used throughout the framework.
 *
 * <h2>Why a dedicated reflection utility class?</h2>
 * Reflection code is verbose, error-prone, and has many checked exceptions.
 * Centralizing it here keeps the rest of the framework clean.
 * Spring has an identical class: {@code org.springframework.util.ReflectionUtils}.
 *
 * <h2>Reflection performance note:</h2>
 * Java reflection has overhead compared to direct method calls:
 * - Method.invoke() is ~3-5x slower than direct calls (JIT may reduce this)
 * - setAccessible() is the main bottleneck (security manager check)
 * - Frameworks cache Method/Constructor/Field objects — never look them up per-call
 *
 * From Java 9+, the JVM's module system (Jigsaw) restricts setAccessible().
 * You may need: --add-opens java.base/java.lang=ALL-UNNAMED in JVM args.
 *
 * <h2>JVM internals of reflection:</h2>
 * When you call {@code method.invoke(target, args)}:
 * 1. JVM checks access (public/private/setAccessible)
 * 2. Generates bytecode (sun.reflect.MethodAccessor) on first call
 * 3. After ~15 invocations, the JVM replaces interpretation with JIT-compiled code
 * 4. For heavily-used methods, performance approaches direct invocation
 *
 * <h2>Interview Questions:</h2>
 * <ul>
 *   <li>What are the performance implications of Java reflection?</li>
 *   <li>What is setAccessible() and why is it restricted in Java 9+?</li>
 *   <li>How does JVM optimize reflection after repeated invocations?</li>
 *   <li>What is the difference between Class.forName() and ClassLoader.loadClass()?</li>
 *   <li>How does the JVM module system affect reflection?</li>
 * </ul>
 */
public final class ReflectionUtils {

    private ReflectionUtils() {
        throw new UnsupportedOperationException("Utility class");
    }

    // ─── Constructor utilities ─────────────────────────────────────────────────

    /**
     * Finds the constructor to use for DI — prefers @Autowired, falls back to no-arg.
     *
     * <h3>Resolution logic:</h3>
     * 1. If exactly one constructor has @Autowired → use it
     * 2. If the class has only one constructor → use it
     * 3. If the class has a no-arg constructor → use it
     * 4. Otherwise → throw exception (ambiguous constructor selection)
     *
     * @param beanClass the class to analyze
     * @return the constructor to use
     * @throws IllegalStateException if no suitable constructor is found
     */
    public static Constructor<?> findPreferredConstructor(Class<?> beanClass) {
        Constructor<?>[] constructors = beanClass.getDeclaredConstructors();

        // Strategy 1: explicit @Autowired
        List<Constructor<?>> autowired = Arrays.stream(constructors)
                .filter(c -> c.isAnnotationPresent(Autowired.class))
                .toList();

        if (autowired.size() == 1) {
            return makeAccessible(autowired.get(0));
        }
        if (autowired.size() > 1) {
            throw new IllegalStateException(
                "Class '%s' has multiple @Autowired constructors. Only one is allowed."
                    .formatted(beanClass.getName()));
        }

        // Strategy 2: single constructor
        if (constructors.length == 1) {
            return makeAccessible(constructors[0]);
        }

        // Strategy 3: no-arg constructor
        return Arrays.stream(constructors)
                .filter(c -> c.getParameterCount() == 0)
                .findFirst()
                .map(ReflectionUtils::makeAccessible)
                .orElseThrow(() -> new IllegalStateException(
                    "Class '%s' has multiple constructors but none is annotated with @Autowired "
                    + "and no no-arg constructor exists.".formatted(beanClass.getName())));
    }

    /**
     * Instantiates a class using the given constructor and arguments.
     *
     * @param constructor the constructor to call
     * @param args        the constructor arguments
     * @return the new instance
     * @throws RuntimeException if instantiation fails
     */
    public static Object instantiate(Constructor<?> constructor, Object[] args) {
        try {
            return constructor.newInstance(args);
        } catch (InvocationTargetException e) {
            // Unwrap: the actual exception from inside the constructor
            throw new RuntimeException(
                "Constructor threw exception for class '%s'"
                    .formatted(constructor.getDeclaringClass().getName()),
                e.getCause());
        } catch (InstantiationException e) {
            throw new RuntimeException(
                "Cannot instantiate abstract class or interface: '%s'"
                    .formatted(constructor.getDeclaringClass().getName()), e);
        } catch (IllegalAccessException e) {
            throw new RuntimeException(
                "Cannot access constructor of '%s'"
                    .formatted(constructor.getDeclaringClass().getName()), e);
        }
    }

    // ─── Field utilities ───────────────────────────────────────────────────────

    /**
     * Returns all fields annotated with the given annotation, including inherited fields.
     *
     * <p>Java's {@code Class.getFields()} returns only public fields.
     * {@code Class.getDeclaredFields()} returns all visibility levels but NOT inherited.
     * This method walks the class hierarchy to get both.
     *
     * @param clazz          the class to inspect
     * @param annotationType the annotation to look for
     * @return all matching fields
     */
    public static List<Field> findAnnotatedFields(Class<?> clazz,
                                                   Class<? extends Annotation> annotationType) {
        List<Field> result = new ArrayList<>();
        Class<?> current = clazz;

        // Walk up the inheritance hierarchy
        while (current != null && current != Object.class) {
            for (Field field : current.getDeclaredFields()) {
                if (field.isAnnotationPresent(annotationType)) {
                    makeAccessible(field);
                    result.add(field);
                }
            }
            current = current.getSuperclass();
        }
        return result;
    }

    /**
     * Sets a field's value on the target object via reflection.
     *
     * @param field  the field to set (must be made accessible first)
     * @param target the object whose field to set
     * @param value  the value to assign
     */
    public static void setField(Field field, Object target, Object value) {
        try {
            makeAccessible(field);
            field.set(target, value);
        } catch (IllegalAccessException e) {
            throw new RuntimeException(
                "Cannot set field '%s' on '%s'"
                    .formatted(field.getName(), target.getClass().getName()), e);
        }
    }

    // ─── Method utilities ──────────────────────────────────────────────────────

    /**
     * Invokes all methods annotated with the given annotation on the target object.
     *
     * <p>Used for @PostConstruct and @PreDestroy processing.
     *
     * @param target         the object to invoke methods on
     * @param annotationType the annotation to look for
     */
    public static void invokeAnnotatedMethods(Object target,
                                               Class<? extends Annotation> annotationType) {
        Class<?> clazz = target.getClass();
        List<Method> methods = findAnnotatedMethods(clazz, annotationType);

        for (Method method : methods) {
            invokeMethod(method, target);
        }
    }

    /**
     * Finds all methods annotated with the given annotation, including inherited.
     */
    public static List<Method> findAnnotatedMethods(Class<?> clazz,
                                                     Class<? extends Annotation> annotationType) {
        List<Method> result = new ArrayList<>();
        Class<?> current = clazz;

        while (current != null && current != Object.class) {
            for (Method method : current.getDeclaredMethods()) {
                if (method.isAnnotationPresent(annotationType)) {
                    validateLifecycleMethod(method);
                    makeAccessible(method);
                    result.add(method);
                }
            }
            current = current.getSuperclass();
        }
        return result;
    }

    /**
     * Invokes a method on the target object with no arguments.
     */
    public static Object invokeMethod(Method method, Object target, Object... args) {
        try {
            makeAccessible(method);
            return method.invoke(target, args);
        } catch (InvocationTargetException e) {
            throw new RuntimeException(
                "Method '%s' threw exception on '%s'"
                    .formatted(method.getName(), target.getClass().getName()),
                e.getCause());
        } catch (IllegalAccessException e) {
            throw new RuntimeException(
                "Cannot access method '%s' on '%s'"
                    .formatted(method.getName(), target.getClass().getName()), e);
        }
    }

    // ─── Annotation utilities ──────────────────────────────────────────────────

    /**
     * Checks if a class has the given annotation OR if it's meta-annotated with it.
     *
     * <h3>Meta-annotation example:</h3>
     * {@code @Controller} is annotated with {@code @Component}.
     * So {@code isMetaAnnotated(UserController.class, Component.class)} returns true.
     *
     * <p>This is how our scanner finds @Controller, @Service, @Repository
     * when scanning for @Component-annotated classes.
     *
     * @param clazz          the class to check
     * @param annotationType the annotation to look for (possibly meta-annotated)
     * @return true if the annotation is present directly or as a meta-annotation
     */
    public static boolean isMetaAnnotated(Class<?> clazz,
                                           Class<? extends Annotation> annotationType) {
        // Check direct annotation
        if (clazz.isAnnotationPresent(annotationType)) {
            return true;
        }

        // Check meta-annotations: annotations ON the annotations of the class
        for (Annotation annotation : clazz.getAnnotations()) {
            Class<? extends Annotation> annotationClass = annotation.annotationType();
            // Avoid infinite recursion on JDK built-in annotations
            if (annotationClass.getPackageName().startsWith("java.lang.annotation")) {
                continue;
            }
            if (annotationClass.isAnnotationPresent(annotationType)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Retrieves the annotation value from a class, including from meta-annotations.
     *
     * <p>For example, getting the @Component value from a @Service-annotated class.
     */
    @SuppressWarnings("unchecked")
    public static <A extends Annotation> A findAnnotation(Class<?> clazz,
                                                            Class<A> annotationType) {
        // Direct annotation
        A annotation = clazz.getAnnotation(annotationType);
        if (annotation != null) {
            return annotation;
        }

        // Meta-annotation (one level deep)
        for (Annotation ann : clazz.getAnnotations()) {
            if (ann.annotationType().isAnnotationPresent(annotationType)) {
                return ann.annotationType().getAnnotation(annotationType);
            }
        }
        return null;
    }

    // ─── Type utilities ────────────────────────────────────────────────────────

    /**
     * Returns all interfaces and superclasses a class implements/extends.
     *
     * <p>Used for byType bean lookup — a bean registered as {@code UserServiceImpl}
     * can be looked up as {@code UserService} (interface) or
     * {@code AbstractUserService} (superclass).
     *
     * @param clazz the class to analyze
     * @return set of the class itself, all superclasses, and all interfaces
     */
    public static Set<Class<?>> getAllTypes(Class<?> clazz) {
        Set<Class<?>> types = new HashSet<>();
        types.add(clazz);

        // Walk superclass chain
        Class<?> superclass = clazz.getSuperclass();
        while (superclass != null && superclass != Object.class) {
            types.add(superclass);
            superclass = superclass.getSuperclass();
        }

        // Add all interfaces (including inherited)
        collectInterfaces(clazz, types);

        return types;
    }

    private static void collectInterfaces(Class<?> clazz, Set<Class<?>> result) {
        for (Class<?> iface : clazz.getInterfaces()) {
            result.add(iface);
            collectInterfaces(iface, result); // recurse for interface hierarchies
        }
        if (clazz.getSuperclass() != null && clazz.getSuperclass() != Object.class) {
            collectInterfaces(clazz.getSuperclass(), result);
        }
    }

    // ─── Access control ────────────────────────────────────────────────────────

    /**
     * Makes a member (Field/Method/Constructor) accessible regardless of visibility.
     *
     * <h3>Java modules note:</h3>
     * In Java 9+, calling setAccessible() on a member in a named module
     * that hasn't opened its packages throws InaccessibleObjectException.
     * Fix: add {@code --add-opens <module>/<package>=ALL-UNNAMED} to JVM args.
     * Spring Boot's embedded server launch script handles this automatically.
     *
     * @param member the member to make accessible
     * @return the member (for chaining)
     */
    public static <T extends AccessibleObject> T makeAccessible(T member) {
        // setAccessible(true) bypasses Java's visibility checks (public/private/protected).
        // This is exactly what Spring does — it's idempotent for already-accessible members.
        // Java 9+ module system may restrict this for modules not opened with --add-opens.
        member.setAccessible(true);
        return member;
    }

    // ─── Validation ───────────────────────────────────────────────────────────

    /**
     * Validates that a lifecycle method (@PostConstruct / @PreDestroy) follows the rules:
     * must be void, take no parameters, and not be static.
     */
    private static void validateLifecycleMethod(Method method) {
        if (method.getReturnType() != void.class) {
            throw new IllegalStateException(
                "Lifecycle method '%s' in '%s' must return void"
                    .formatted(method.getName(), method.getDeclaringClass().getName()));
        }
        if (method.getParameterCount() != 0) {
            throw new IllegalStateException(
                "Lifecycle method '%s' in '%s' must have no parameters"
                    .formatted(method.getName(), method.getDeclaringClass().getName()));
        }
        if (Modifier.isStatic(method.getModifiers())) {
            throw new IllegalStateException(
                "Lifecycle method '%s' in '%s' must not be static"
                    .formatted(method.getName(), method.getDeclaringClass().getName()));
        }
    }
}
