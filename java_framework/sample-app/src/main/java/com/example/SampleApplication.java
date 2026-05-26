package com.example;

import io.javaframework.context.FrameworkApplication;
import io.javaframework.context.ApplicationContextImpl;

/**
 * Entry point for the sample application.
 *
 * <h2>Three-line framework usage:</h2>
 * This is the developer experience we've built toward.
 * One line to start a fully-functional REST API server with:
 * - Embedded HTTP server (Jetty)
 * - Dependency injection (IoC container)
 * - Classpath scanning for components
 * - JSON serialization (Jackson)
 * - Route registration from annotations
 * - Graceful shutdown on Ctrl+C
 *
 * <h2>What happens when you run main():</h2>
 * <pre>
 *   1. FrameworkApplication.run() is called
 *   2. Base package "com.example" is determined
 *   3. ClassPathScanner scans com.example.** for @Component classes
 *   4. Found: UserRepository, UserService, UserController, HealthController
 *   5. BeanDefinitions created for each
 *   6. Beans instantiated in dependency order:
 *      - UserRepository (no deps) created first
 *      - UserRepository.init() called (@PostConstruct) — seeds data
 *      - UserService(UserRepository) created via constructor injection
 *      - UserController(UserService) created via constructor injection
 *      - HealthController() created (no deps)
 *   7. Routes registered:
 *      - GET  /api/users           → UserController.getAllUsers()
 *      - GET  /api/users/{id}      → UserController.getUserById()
 *      - POST /api/users           → UserController.createUser()
 *      - DELETE /api/users/{id}    → UserController.deleteUser()
 *      - GET  /api/health          → HealthController.health()
 *      - GET  /api/info            → HealthController.info()
 *   8. Jetty starts on port 8080
 *   9. Application ready!
 * </pre>
 */
public class SampleApplication {

    public static void main(String[] args) {
        // One line to start the entire application
        ApplicationContextImpl context = FrameworkApplication.run(SampleApplication.class, args);

        // The application is now running and blocking on Jetty
        // Press Ctrl+C to trigger the shutdown hook
        System.out.println("\nApplication running. Press Ctrl+C to stop.\n");
        System.out.println("Try these endpoints:");
        System.out.println("  curl http://localhost:8080/api/health");
        System.out.println("  curl http://localhost:8080/api/users");
        System.out.println("  curl http://localhost:8080/api/users/1");
        System.out.println("  curl -X POST http://localhost:8080/api/users \\");
        System.out.println("       -H 'Content-Type: application/json' \\");
        System.out.println("       -d '{\"name\":\"Dave\",\"email\":\"dave@example.com\"}'");
    }
}
