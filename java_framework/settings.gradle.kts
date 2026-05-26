/**
 * Settings file for the Java Framework multi-module Gradle project.
 *
 * WHY MULTI-MODULE?
 * -----------------
 * Just like Spring Boot splits into spring-core, spring-web, spring-context etc.,
 * we split our framework so users can include ONLY what they need.
 * This follows the "Separation of Concerns" principle at the build system level.
 *
 * A user who only needs the DI container can depend on framework-core alone.
 * A user building a web app includes framework-context (which pulls in everything).
 *
 * SPRING COMPARISON:
 * - spring-core      → framework-core      (annotations, bean lifecycle, reflection utils)
 * - spring-beans     → framework-core      (bean factory, bean definitions)
 * - spring-context   → framework-context   (application context, auto-configuration)
 * - spring-web       → framework-web       (routing, request/response, middleware)
 * - spring-webmvc    → framework-web       (controller invoker, dispatcher)
 * - embedded tomcat  → framework-server    (embedded jetty)
 * - jackson-databind → framework-json      (json serialization)
 */
rootProject.name = "java-framework"

// ─── Core modules ────────────────────────────────────────────────────────────
include("framework-core")       // Annotations, IoC container, bean lifecycle, classpath scanner
include("framework-web")        // HTTP routing, controllers, request/response, middleware
include("framework-server")     // Embedded Jetty server abstraction
include("framework-json")       // JSON serialization (Jackson wrapper)
include("framework-context")    // Application bootstrap, auto-configuration, DI orchestration

// ─── Extension modules (Phase 2+) ────────────────────────────────────────────
// include("framework-validation")   // Bean validation (@NotNull, @Size, etc.)
// include("framework-security")     // JWT + role-based auth
// include("framework-orm")          // Query builder + repository pattern
// include("framework-test")         // Testing utilities

// ─── Applications ────────────────────────────────────────────────────────────
include("sample-app")           // Demonstration application

// ─── Plugin management ───────────────────────────────────────────────────────
pluginManagement {
    repositories {
        gradlePluginPortal()
        mavenCentral()
    }
}
