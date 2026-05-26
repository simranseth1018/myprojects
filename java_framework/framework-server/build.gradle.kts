/**
 * framework-server: Embedded HTTP server integration.
 *
 * This module bridges Jetty's raw HTTP infrastructure with our framework's
 * routing and middleware system. It owns all Jetty-specific code so the
 * rest of the framework remains server-agnostic.
 *
 * SPRING BOOT COMPARISON:
 * Spring Boot's spring-boot-autoconfigure contains TomcatEmbeddedWebServerFactory,
 * JettyServletWebServerFactory, and UndertowServletWebServerFactory.
 * All implement WebServerFactory. The DispatcherServlet is registered in each.
 * We follow this same factory/adapter pattern.
 *
 * ARCHITECTURE DECISION — WHY JETTY?
 * - Lighter than Tomcat (Spring Boot's default)
 * - Better async and WebSocket support
 * - Used by Micronaut and Dropwizard by default
 * - Clean programmatic API (no XML config needed)
 * - Excellent Java 21 + Virtual Thread support
 *
 * PERFORMANCE NOTE (Java 21 Virtual Threads):
 * Traditional thread-per-request servers (Tomcat/Jetty blocking) hit a wall
 * at ~10k concurrent connections (OS thread limit ~1MB stack each).
 * With Java 21 Virtual Threads: each request gets a VT (tiny, heap-allocated),
 * so we can handle millions of concurrent requests on 8 OS threads.
 * We configure Jetty to use a virtual thread executor.
 */
plugins {
    java
}

dependencies {
    implementation(project(":framework-core"))
    implementation(project(":framework-web"))
    implementation(project(":framework-json"))

    // Jetty 11 — battle-tested embedded HTTP server
    // jetty-server: core HTTP server
    // jetty-servlet: servlet container support (registers our DispatcherServlet)
    // Jetty 10 uses javax.servlet (Servlet 4.0 / Java EE 8) — consistent with our imports.
    // Jetty 11+ migrated to jakarta.servlet (Jakarta EE 9+) which would require
    // renaming all javax.servlet imports. We use Jetty 10 to stay with javax.servlet.
    implementation("org.eclipse.jetty:jetty-server:10.0.20")
    implementation("org.eclipse.jetty:jetty-servlet:10.0.20")
    implementation("org.eclipse.jetty:jetty-util:10.0.20")

    // Servlet API implementation (Jetty provides this at runtime)
    implementation("javax.servlet:javax.servlet-api:4.0.1")

    implementation("org.slf4j:slf4j-api:2.0.9")
    implementation("ch.qos.logback:logback-classic:1.4.14")
}
