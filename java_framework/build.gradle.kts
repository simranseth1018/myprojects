/**
 * Root build file for the Java Framework.
 *
 * This file defines configuration shared across ALL submodules.
 *
 * INDUSTRY PRACTICE:
 * In large projects (like Spring Boot's own build), the root build.gradle
 * defines:
 *   - Common dependencies (test frameworks, logging)
 *   - Java version requirements
 *   - Code quality plugins (checkstyle, PMD, SpotBugs)
 *   - Publishing configuration (Maven Central)
 *
 * For now we keep it clean and focused on essentials.
 */

plugins {
    java
}

// ─── Project-wide properties ──────────────────────────────────────────────────
group = "io.javaframework"
version = "1.0.0-SNAPSHOT"

// ─── Version catalog (centralized dependency versions) ───────────────────────
// WHY CENTRALIZE VERSIONS?
// If Jackson is used in 3 modules, you want ONE place to bump the version.
// Spring Boot uses a BOM (Bill of Materials) for this. We use a simple map.
val versions = mapOf(
    "jetty"       to "11.0.18",
    "jackson"     to "2.16.1",
    "slf4j"       to "2.0.9",
    "logback"     to "1.4.14",
    "reflections" to "0.10.2",
    "junit"       to "5.10.1",
    "mockito"     to "5.8.0",
    "assertj"     to "3.25.1"
)

// ─── Configuration shared by ALL modules ─────────────────────────────────────
allprojects {
    group = "io.javaframework"
    version = "1.0.0-SNAPSHOT"

    repositories {
        mavenCentral()
    }
}

// ─── Configuration shared by all SUBMODULES ──────────────────────────────────
subprojects {
    apply(plugin = "java")

    // ── Java 21 configuration ──────────────────────────────────────────────
    // WHY JAVA 21?
    // - Virtual Threads (Project Loom) → massive concurrency improvement
    // - Records → cleaner DTOs
    // - Sealed Classes → better type hierarchies
    // - Pattern Matching → cleaner instanceof checks
    // - Text Blocks → cleaner string literals
    configure<JavaPluginExtension> {
        sourceCompatibility = JavaVersion.VERSION_21
        targetCompatibility = JavaVersion.VERSION_21

        // Generate sources and Javadoc JARs for open-source publishing
        withSourcesJar()
        withJavadocJar()
    }

    // ── Compiler options ───────────────────────────────────────────────────
    tasks.withType<JavaCompile> {
        options.encoding = "UTF-8"
        options.compilerArgs.addAll(listOf(
            "-parameters",          // Preserve method parameter names (critical for @PathVariable)
            "-Xlint:all",           // Enable all lint warnings
            "-Xlint:-processing",   // Suppress annotation processing warnings
            "-Xlint:-serial"        // Suppress serialVersionUID warnings for exception classes
        ))
    }

    // ── Universal test dependencies ────────────────────────────────────────
    dependencies {
        // JUnit 5 – the standard for modern Java testing
        "testImplementation"("org.junit.jupiter:junit-jupiter-api:${versions["junit"]}")
        "testImplementation"("org.junit.jupiter:junit-jupiter-params:${versions["junit"]}")
        "testRuntimeOnly"("org.junit.jupiter:junit-jupiter-engine:${versions["junit"]}")
        "testRuntimeOnly"("org.junit.platform:junit-platform-launcher:1.10.1")

        // Mockito – industry-standard mocking framework
        "testImplementation"("org.mockito:mockito-core:${versions["mockito"]}")
        "testImplementation"("org.mockito:mockito-junit-jupiter:${versions["mockito"]}")

        // AssertJ – fluent assertions (much more readable than JUnit's assert*)
        "testImplementation"("org.assertj:assertj-core:${versions["assertj"]}")

        // SLF4J + Logback for test output
        "testImplementation"("org.slf4j:slf4j-api:${versions["slf4j"]}")
        "testRuntimeOnly"("ch.qos.logback:logback-classic:${versions["logback"]}")
    }

    // ── Test configuration ─────────────────────────────────────────────────
    tasks.withType<Test> {
        useJUnitPlatform()

        testLogging {
            events("passed", "skipped", "failed")
            showExceptions = true
            showCauses = true
            showStackTraces = true
        }

        // Enable virtual threads for test execution (Java 21)
        jvmArgs("-Djunit.jupiter.execution.parallel.enabled=true")
    }

    // ── Javadoc configuration ──────────────────────────────────────────────
    tasks.withType<Javadoc> {
        options.encoding = "UTF-8"
        (options as StandardJavadocDocletOptions).apply {
            addStringOption("Xdoclint:none", "-quiet")
            tags("implNote:a:Implementation Note:")
            tags("apiNote:a:API Note:")
        }
    }
}

// ─── Convenience task: build all and run all tests ────────────────────────────
tasks.register("buildAll") {
    group = "build"
    description = "Build all modules and run all tests"
    dependsOn(subprojects.map { "${it.path}:build" })
}
