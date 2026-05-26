/**
 * framework-web: HTTP routing, request/response model, controllers, middleware.
 *
 * This module knows about HTTP but NOT about Jetty or any specific server.
 * It operates on abstracted HttpRequest/HttpResponse objects that are
 * populated by the server layer.
 *
 * WHY THIS SEPARATION?
 * Spring MVC separates DispatcherServlet (web layer) from the embedded
 * Tomcat/Jetty (server layer). This means you can run Spring MVC on
 * any Servlet container. We follow the same pattern.
 *
 * DEPENDENCY DIRECTION:
 *   framework-web → framework-core  (uses IoC annotations)
 *   framework-web → framework-json  (serializes responses)
 *   framework-server → framework-web (calls Router/RequestHandler)
 *   (framework-web does NOT know about framework-server)
 */
plugins {
    java
}

dependencies {
    // Our own modules
    implementation(project(":framework-core"))
    implementation(project(":framework-json"))

    // Servlet API — used as the bridge between Jetty's raw HTTP handling
    // and our routing layer. Jetty calls our servlet; servlet calls our Router.
    // WHY JAVAX (not JAKARTA)?
    // We use Jetty 11 which implements javax.servlet (Servlet 5.0, part of Java EE 8).
    // Jetty 12 uses jakarta.servlet (Jakarta EE 10). We'll migrate in a future phase.
    // Jetty 10 provides javax.servlet-api 4.0.1 at runtime
    compileOnly("javax.servlet:javax.servlet-api:4.0.1")
    testImplementation("javax.servlet:javax.servlet-api:4.0.1")
    testRuntimeOnly("org.eclipse.jetty:jetty-servlet:10.0.20") // provides runtime impl

    implementation("org.slf4j:slf4j-api:2.0.9")
    testRuntimeOnly("ch.qos.logback:logback-classic:1.4.14")
}
