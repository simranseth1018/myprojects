package io.javaframework.core.scanner;

import java.util.Set;

/**
 * Contract for classpath scanning — discovering annotated classes at startup.
 *
 * <h2>What is classpath scanning?</h2>
 * At startup, the framework needs to find all classes you've annotated with
 * @Component, @Controller, @Service, @Repository etc. It does this by scanning
 * the classpath — the set of directories and JARs the JVM knows about.
 *
 * <h2>How does the JVM's classpath work?</h2>
 * The JVM's ClassLoader maintains a list of locations (directories and JARs)
 * to search for .class files. When you run {@code java -cp target/classes:lib/*.jar MyApp},
 * those paths form the classpath. The ClassLoader loads .class files on demand.
 *
 * <h2>Scanning approaches:</h2>
 *
 * <h3>1. Load-and-inspect (our approach)</h3>
 * Get the classpath URL from the ClassLoader, walk the .class files,
 * load each class with Class.forName(), check for annotations.
 * Simple but loads ALL classes into the JVM heap — slow for large classpaths.
 *
 * <h3>2. ASM bytecode reading (Spring's approach)</h3>
 * Read the .class file binary directly using ASM (bytecode manipulation library).
 * Check for annotation constants WITHOUT loading the class into the JVM.
 * 10-50x faster than approach 1 for large classpaths.
 * Spring's {@code ClassPathScanningCandidateComponentProvider} uses this.
 *
 * <h3>3. Index files (Micronaut's approach)</h3>
 * At COMPILE TIME, an annotation processor generates an index file listing
 * all annotated classes. At runtime, just read the index — no scanning needed.
 * This is why Micronaut starts in ~50ms vs Spring's ~3-10s.
 *
 * <h2>Interview Questions:</h2>
 * <ul>
 *   <li>How does Spring scan the classpath for @Component classes?</li>
 *   <li>Why is Spring startup slower than Micronaut?</li>
 *   <li>What is ASM and why does Spring use it for scanning?</li>
 *   <li>What is the difference between ClassLoader.loadClass() and Class.forName()?</li>
 *   <li>How does GraalVM native image solve the reflection/scanning problem?</li>
 * </ul>
 */
public interface ClassPathScanner {

    /**
     * Scans the given base package and returns all classes annotated with
     * framework stereotype annotations (@Component, @Controller, @Service, @Repository).
     *
     * @param basePackage the package to scan (e.g., "com.example")
     * @return set of all discovered component classes
     */
    Set<Class<?>> scan(String basePackage);

    /**
     * Scans multiple packages.
     *
     * @param basePackages the packages to scan
     * @return union of all classes found across all packages
     */
    Set<Class<?>> scan(String... basePackages);
}
