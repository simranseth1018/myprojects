/**
 * framework-core: The heart of the framework.
 *
 * This module has ZERO framework dependencies — it depends only on
 * standard JDK libraries and logging.
 *
 * WHY NO EXTERNAL DEPS?
 * The core module must be lightweight. If you depend on framework-core,
 * you shouldn't be forced to pull in Jetty or Jackson.
 * Spring's spring-core has the same philosophy — it only needs spring-jcl
 * (logging bridge) and nothing else.
 *
 * Contents:
 *   - All stereotype annotations (@Component, @Controller, @Service, @Repository)
 *   - Injection annotations (@Autowired, @Qualifier, @Scope)
 *   - Lifecycle annotations (@PostConstruct, @PreDestroy)
 *   - BeanDefinition (metadata about beans)
 *   - BeanFactory (creates and manages beans)
 *   - ClassPathScanner (finds annotated classes on the classpath)
 *   - Core exception types
 *   - Utility classes (ReflectionUtils, StringUtils)
 */
plugins {
    java
}

dependencies {
    // Classpath scanning — finds annotated classes without loading them all
    // In production frameworks, this is done with ASM bytecode reading.
    // We use Reflections library which wraps common classpath scanning utilities.
    // SPRING COMPARISON: Spring uses its own ClassPathScanningCandidateComponentProvider
    // backed by ASM for performance (avoids class-loading overhead).
    implementation("org.reflections:reflections:0.10.2")

    // Google Guava — used by Reflections library internally
    implementation("com.google.guava:guava:33.0.0-jre")

    // SLF4J — logging facade (no implementation dependency, just the API)
    // Modules define the API; applications choose the implementation (Logback, Log4j2, etc.)
    implementation("org.slf4j:slf4j-api:2.0.9")

    // Logback for runtime logging (only in test scope for this module)
    testRuntimeOnly("ch.qos.logback:logback-classic:1.4.14")
}
