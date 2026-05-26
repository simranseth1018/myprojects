package io.javaframework.core.scanner;

import com.google.common.reflect.ClassPath;
import io.javaframework.core.annotation.Component;
import io.javaframework.core.util.ReflectionUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.lang.reflect.Modifier;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Default ClassPathScanner using Guava's ClassPath utility.
 *
 * <h2>Why Guava's ClassPath instead of Reflections library?</h2>
 * Guava's {@code ClassPath} is more reliable across different execution environments:
 * - Gradle's JavaExec (run task)
 * - Fat JARs (Shadow plugin)
 * - IDE run configurations
 * - Unit tests
 *
 * The Reflections library's URL-based scanning can miss class directories in Gradle.
 * Guava's ClassPath.from(classLoader) uses the classloader's entries directly.
 *
 * <h2>How Guava ClassPath works:</h2>
 * 1. Takes a ClassLoader as input
 * 2. Iterates through all entries on the classloader's classpath (URLs)
 * 3. For each directory or JAR, lists all .class files
 * 4. Converts .class file paths to class names (com/example/Foo.class → com.example.Foo)
 * 5. Returns ClassInfo objects you can load on-demand
 *
 * <h2>Spring's approach (for comparison):</h2>
 * Spring uses ASM (bytecode library) to READ .class files without loading them.
 * It checks for the @Component annotation constant in the class file header.
 * This is much faster for large classpaths because:
 * - No class-loading overhead (~10x-100x faster)
 * - No static initializer execution
 * - No PermGen/Metaspace pressure
 *
 * <h2>Our approach (simpler, educational):</h2>
 * We load each class and use reflection to check annotations.
 * For a learning framework this is acceptable. For production at scale,
 * switch to ASM-based scanning.
 *
 * @see ClassPathScanner
 */
public class ClassPathScannerImpl implements ClassPathScanner {

    private static final Logger log = LoggerFactory.getLogger(ClassPathScannerImpl.class);

    @Override
    public Set<Class<?>> scan(String basePackage) {
        log.debug("Scanning package: {}", basePackage);

        // Use the classloader that loaded THIS class (the framework's classloader).
        // This is the same classloader that has the application classes on its path.
        // In Gradle's run task, this is the App classloader with the full classpath.
        ClassLoader classLoader = getClassLoader();

        try {
            ClassPath classPath = ClassPath.from(classLoader);

            // getAllClasses() returns every class the classLoader can see.
            // We then filter by package prefix ourselves — this works across
            // all Guava versions and all execution environments (Gradle run,
            // fat JARs, IDE run configs, unit tests).
            //
            // Why not getTopLevelClassesRecursively(pkg)?
            //   → Not available in all Guava versions; caused "cannot find symbol".
            // Why not getTopLevelClasses(pkg) (exact match)?
            //   → Only returns classes in that exact package, misses sub-packages.
            Set<ClassPath.ClassInfo> classInfos = classPath.getAllClasses().stream()
                .filter(ci -> ci.getPackageName().equals(basePackage)
                           || ci.getPackageName().startsWith(basePackage + "."))
                .collect(Collectors.toSet());

            log.debug("Found {} class files in package '{}'", classInfos.size(), basePackage);

            Set<Class<?>> components = new HashSet<>();

            for (ClassPath.ClassInfo classInfo : classInfos) {
                Class<?> clazz = tryLoad(classInfo);
                if (clazz == null) continue;

                // Check if it's annotated with @Component or a meta-annotated stereotype
                if (ReflectionUtils.isMetaAnnotated(clazz, Component.class)) {
                    components.add(clazz);
                }
            }

            // Filter out abstract classes, interfaces, etc.
            Set<Class<?>> result = filterEligibleClasses(components);

            log.info("Classpath scan of '{}' found {} component(s)", basePackage, result.size());
            result.forEach(c -> log.debug("  - Discovered: {}", c.getName()));

            return result;

        } catch (IOException e) {
            log.error("Failed to scan classpath for package: {}", basePackage, e);
            return Collections.emptySet();
        }
    }

    @Override
    public Set<Class<?>> scan(String... basePackages) {
        Set<Class<?>> all = new HashSet<>();
        for (String pkg : basePackages) {
            all.addAll(scan(pkg));
        }
        return all;
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    /**
     * Gets the best available ClassLoader for scanning.
     *
     * <h3>ClassLoader hierarchy in Java:</h3>
     * Bootstrap ClassLoader → Extension CL → App (System) CL → Custom CLs
     *
     * For frameworks, we want the ClassLoader that has the application's classes.
     * In most environments, this is either:
     * - The thread's context classloader (set by the container/app server)
     * - The classloader of this framework class (parent of app classes)
     * - The system classloader (for simple flat classpaths)
     */
    private ClassLoader getClassLoader() {
        // Try thread context classloader first (most likely to have app classes)
        ClassLoader contextCl = Thread.currentThread().getContextClassLoader();
        if (contextCl != null) {
            return contextCl;
        }

        // Fallback to this class's classloader
        ClassLoader frameworkCl = ClassPathScannerImpl.class.getClassLoader();
        if (frameworkCl != null) {
            return frameworkCl;
        }

        // Last resort: system classloader
        return ClassLoader.getSystemClassLoader();
    }

    /**
     * Attempts to load a class, returning null if it fails.
     *
     * <p>Some classes may fail to load due to:
     * - Missing dependencies (NoClassDefFoundError)
     * - Linkage errors
     * - Security restrictions
     *
     * We skip these gracefully rather than failing the entire scan.
     */
    private Class<?> tryLoad(ClassPath.ClassInfo classInfo) {
        try {
            return classInfo.load();
        } catch (LinkageError e) {
            // Covers NoClassDefFoundError (subclass), UnsatisfiedLinkError, etc.
            // Multi-catch `NoClassDefFoundError | LinkageError` is illegal because
            // NoClassDefFoundError IS-A LinkageError (Java forbids related types in multi-catch).
            log.trace("Skipping class '{}': {}", classInfo.getName(), e.getMessage());
            return null;
        } catch (Exception e) {
            log.trace("Failed to load class '{}': {}", classInfo.getName(), e.getMessage());
            return null;
        }
    }

    /**
     * Filters out classes that cannot or should not be managed by the IoC container.
     */
    private Set<Class<?>> filterEligibleClasses(Set<Class<?>> candidates) {
        Set<Class<?>> eligible = new HashSet<>();

        for (Class<?> clazz : candidates) {
            int modifiers = clazz.getModifiers();

            if (Modifier.isAbstract(modifiers)) continue;
            if (Modifier.isInterface(modifiers)) continue;
            if (clazz.isAnnotation()) continue;
            if (clazz.isEnum()) continue;
            if (clazz.isMemberClass() && !Modifier.isStatic(modifiers)) continue;

            eligible.add(clazz);
        }

        return eligible;
    }
}
