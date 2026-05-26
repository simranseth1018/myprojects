package io.javaframework.context;

import io.javaframework.server.ServerConfiguration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Entry point for launching a Java Framework application.
 *
 * <h2>Usage:</h2>
 * <pre>{@code
 *   @Component
 *   public class SampleApplication {
 *       public static void main(String[] args) {
 *           FrameworkApplication.run(SampleApplication.class, args);
 *       }
 *   }
 * }</pre>
 *
 * <h2>Spring Boot comparison:</h2>
 * This is the equivalent of {@code SpringApplication.run(MyApp.class, args)}.
 *
 * SpringApplication.run() does:
 * 1. Determines application type (Servlet, Reactive, None)
 * 2. Loads ApplicationContextInitializers from spring.factories
 * 3. Loads ApplicationListeners from spring.factories
 * 4. Determines the main application class (for the banner)
 * 5. Creates and refreshes the ApplicationContext
 * 6. Calls ApplicationRunner / CommandLineRunner beans
 * 7. Publishes ApplicationStartedEvent
 *
 * Ours does the essentials: determine scan package, create context, refresh.
 *
 * <h2>Convention: base package detection</h2>
 * We use the main application class to determine the root scan package.
 * If your main class is {@code com.example.SampleApplication}, we scan
 * {@code com.example} and all its subpackages.
 *
 * Spring Boot follows the same convention — that's why Spring Boot apps
 * have their main class in the ROOT package of their application.
 *
 * <h2>Interview Questions:</h2>
 * <ul>
 *   <li>Why should the Spring Boot main class be in the root package?</li>
 *   <li>What does SpringApplication.run() do internally?</li>
 *   <li>What is spring.factories and how is it used?</li>
 *   <li>What is the difference between ApplicationRunner and CommandLineRunner?</li>
 *   <li>How does Spring Boot auto-configuration work?</li>
 * </ul>
 */
public final class FrameworkApplication {

    private static final Logger log = LoggerFactory.getLogger(FrameworkApplication.class);

    // Prevent instantiation
    private FrameworkApplication() {}

    /**
     * Runs the application with default configuration (port 8080).
     *
     * @param mainClass the main application class (used to determine base package)
     * @param args      command-line arguments (reserved for future use)
     * @return the started ApplicationContextImpl
     */
    public static ApplicationContextImpl run(Class<?> mainClass, String... args) {
        return run(mainClass, ServerConfiguration.defaultConfig(), args);
    }

    /**
     * Runs the application on a specific port.
     *
     * @param mainClass the main application class
     * @param port      the HTTP port to listen on
     * @param args      command-line arguments
     * @return the started ApplicationContextImpl
     */
    public static ApplicationContextImpl run(Class<?> mainClass, int port, String... args) {
        return run(mainClass, ServerConfiguration.onPort(port), args);
    }

    /**
     * Runs the application with full server configuration control.
     *
     * <p>This is the master run() method. All other overloads delegate here.
     *
     * @param mainClass    the main application class
     * @param serverConfig the server configuration
     * @param args         command-line arguments
     * @return the started ApplicationContextImpl
     */
    public static ApplicationContextImpl run(Class<?> mainClass,
                                             ServerConfiguration serverConfig,
                                             String... args) {
        printBanner();

        // ── Determine base package ─────────────────────────────────────────────
        // Convention: scan the package that contains the main class, and all sub-packages
        String basePackage = determineBasePackage(mainClass);
        log.info("Base package: {}", basePackage);

        // ── Parse command line arguments ───────────────────────────────────────
        serverConfig = parseArgs(serverConfig, args);

        // ── Create and start the application context ───────────────────────────
        ApplicationContextImpl context = new ApplicationContextImpl(
            mainClass.getSimpleName(),
            new String[]{basePackage},
            serverConfig
        );

        context.refresh();

        return context;
    }

    /**
     * Determines the base scan package from the main class.
     *
     * <p>If the main class is {@code com.example.myapp.Application},
     * the base package is {@code com.example.myapp}.
     *
     * <p>If the main class is in the default package (not recommended),
     * we scan everything — potentially slow on large classpaths.
     */
    private static String determineBasePackage(Class<?> mainClass) {
        String className = mainClass.getName();
        int lastDot = className.lastIndexOf('.');

        if (lastDot > 0) {
            return className.substring(0, lastDot);
        }

        // Default package — scan everything (warn the developer)
        log.warn("Main class '{}' is in the default package. " +
                 "It is recommended to place your application class in a named package " +
                 "to avoid scanning the entire classpath.", mainClass.getSimpleName());
        return "";
    }

    /**
     * Parses command-line arguments for configuration overrides.
     *
     * <p>Supported: {@code --server.port=9090}
     * (Phase 3 will add full properties file support)
     */
    private static ServerConfiguration parseArgs(ServerConfiguration config, String[] args) {
        if (args == null || args.length == 0) return config;

        for (String arg : args) {
            if (arg.startsWith("--server.port=")) {
                try {
                    int port = Integer.parseInt(arg.substring("--server.port=".length()).trim());
                    log.info("Port override from command line: {}", port);
                    config = config.withPort(port);
                } catch (NumberFormatException e) {
                    log.warn("Invalid --server.port value: {}", arg);
                }
            }
        }

        return config;
    }

    /**
     * Prints the framework banner on startup.
     *
     * <p>Spring Boot prints its banner from src/main/resources/banner.txt.
     * Ours is hardcoded. Phase 3 will add customizable banners.
     */
    private static void printBanner() {
        System.out.println("""

              ╔═══════════════════════════════════════════╗
              ║                                           ║
              ║    ██╗ █████╗ ██╗   ██╗ █████╗           ║
              ║    ██║██╔══██╗██║   ██║██╔══██╗          ║
              ║    ██║███████║██║   ██║███████║          ║
              ║██  ██║██╔══██║╚██╗ ██╔╝██╔══██║          ║
              ║╚█████╔╝██║  ██║ ╚████╔╝ ██║  ██║         ║
              ║ ╚════╝ ╚═╝  ╚═╝  ╚═══╝  ╚═╝  ╚═╝         ║
              ║                                           ║
              ║     Java Framework  v1.0.0-SNAPSHOT      ║
              ║     Java 21 | Jetty 11 | Jackson 2.16    ║
              ╚═══════════════════════════════════════════╝
            """);
    }
}
