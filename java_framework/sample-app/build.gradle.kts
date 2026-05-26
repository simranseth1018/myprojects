/**
 * sample-app: Demonstrates the framework in action.
 *
 * A real-world developer only needs to depend on framework-context.
 * All other modules are pulled in transitively (just like Spring Boot Starter Web).
 *
 * The fat JAR (shadow JAR) packages everything into one executable artifact.
 *
 * SPRING BOOT COMPARISON:
 * Your Spring Boot app depends on spring-boot-starter-web which is a starter POM
 * that pulls in spring-web, spring-webmvc, spring-boot, spring-boot-autoconfigure,
 * spring-boot-starter, spring-boot-starter-tomcat, jackson-databind, etc.
 * We're building exactly that kind of transitive dependency chain.
 */
plugins {
    java
    // Shadow plugin to create a fat/uber JAR with all dependencies
    id("com.github.johnrengelman.shadow") version "8.1.1"
}

dependencies {
    // The developer only sees this one dependency
    implementation(project(":framework-context"))

    // SLF4J API — available transitively from framework-core, but
    // sample-app uses it directly (Logger in UserService etc.)
    implementation("org.slf4j:slf4j-api:2.0.9")

    // Logback as the SLF4J implementation for the application
    runtimeOnly("ch.qos.logback:logback-classic:1.4.14")
}

// ── Fat JAR configuration ─────────────────────────────────────────────────────
// This creates an executable JAR: java -jar sample-app.jar
tasks.shadowJar {
    archiveBaseName.set("sample-app")
    archiveClassifier.set("")
    archiveVersion.set("")
    manifest {
        attributes["Main-Class"] = "com.example.SampleApplication"
    }
    // Merge service files (important for ServiceLoader-based plugins)
    mergeServiceFiles()
}

// Make 'build' task depend on shadowJar
tasks.build {
    dependsOn(tasks.shadowJar)
}

// Convenience task: run the sample app
tasks.register<JavaExec>("run") {
    group = "application"
    description = "Run the sample application"
    classpath = sourceSets.main.get().runtimeClasspath
    mainClass.set("com.example.SampleApplication")
}
