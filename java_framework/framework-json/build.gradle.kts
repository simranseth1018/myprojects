/**
 * framework-json: JSON serialization/deserialization.
 *
 * WHY A SEPARATE JSON MODULE?
 * You might want to swap Jackson for Gson, Moshi, or a custom serializer.
 * By hiding Jackson behind a JsonSerializer interface, the rest of the framework
 * doesn't know or care which library is used. This is the "Dependency Inversion"
 * principle in action — framework-web depends on JsonSerializer (abstraction),
 * not JacksonJsonSerializer (concrete implementation).
 *
 * SPRING COMPARISON:
 * Spring uses HttpMessageConverter for this. When you return an object from a
 * @RestController, Spring iterates its registered MessageConverters and picks
 * MappingJackson2HttpMessageConverter to write the JSON.
 */
plugins {
    java
}

dependencies {
    // Jackson — the industry-standard JSON library for Java
    // jackson-databind includes core + annotations
    implementation("com.fasterxml.jackson.core:jackson-databind:2.16.1")

    // Jackson support for Java 8 date/time types (LocalDate, etc.)
    implementation("com.fasterxml.jackson.datatype:jackson-datatype-jsr310:2.16.1")

    // Jackson support for Java records and other Java 17+ features
    implementation("com.fasterxml.jackson.module:jackson-module-parameter-names:2.16.1")

    implementation("org.slf4j:slf4j-api:2.0.9")
    testRuntimeOnly("ch.qos.logback:logback-classic:1.4.14")
}
