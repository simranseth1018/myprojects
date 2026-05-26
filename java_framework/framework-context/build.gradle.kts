/**
 * framework-context: The application bootstrap and orchestration layer.
 *
 * This is the "glue" module that wires everything together:
 *   1. Scans the classpath for annotated classes (ClassPathScanner from core)
 *   2. Registers beans in the IoC container (DefaultBeanFactory from core)
 *   3. Discovers @Controller classes and registers routes (Router from web)
 *   4. Starts the embedded server (JettyServer from server)
 *   5. Handles graceful shutdown (JVM shutdown hook)
 *
 * SPRING BOOT COMPARISON:
 * This is analogous to SpringApplication.run():
 *   - Creates ApplicationContext
 *   - Runs ApplicationContextInitializers
 *   - Loads AutoConfigurations (spring.factories / META-INF/spring)
 *   - Calls ApplicationRunner / CommandLineRunner beans
 *   - Starts embedded server
 *   - Prints the banner :)
 *
 * AUTO-CONFIGURATION:
 * Spring Boot's @EnableAutoConfiguration loads configurations from
 * META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports.
 * We implement a simpler version: automatically configure JSON, server, and
 * routing based on what's on the classpath (convention over configuration).
 */
plugins {
    // java-library exposes 'api' configuration: transitive compile deps for consumers
    // 'implementation' = internal only (not visible to sample-app)
    // 'api' = public contract (visible to sample-app's compile classpath)
    // SPRING COMPARISON: Spring Boot starter POMs use <scope>compile</scope> for deps
    // that consumers need to compile against (annotations, interfaces, etc.)
    `java-library`
}

dependencies {
    // 'api' instead of 'implementation': these are EXPOSED to framework consumers.
    // When sample-app depends on framework-context, it can also compile against
    // framework-core annotations (@Component, @Autowired) and framework-web types
    // (HttpResponse, @GetMapping) without needing to declare them separately.
    api(project(":framework-core"))
    api(project(":framework-web"))
    api(project(":framework-server"))
    api(project(":framework-json"))

    implementation("org.slf4j:slf4j-api:2.0.9")
    implementation("ch.qos.logback:logback-classic:1.4.14")
}
