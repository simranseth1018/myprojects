package io.javaframework.context;

import io.javaframework.core.annotation.*;
import io.javaframework.core.bean.*;
import io.javaframework.core.context.ApplicationContext;
import io.javaframework.core.scanner.ClassPathScanner;
import io.javaframework.core.scanner.ClassPathScannerImpl;
import io.javaframework.core.util.ReflectionUtils;
import io.javaframework.core.util.StringUtils;
import io.javaframework.json.JacksonJsonSerializer;
import io.javaframework.json.JsonSerializer;
import io.javaframework.server.EmbeddedServer;
import io.javaframework.server.ServerConfiguration;
import io.javaframework.server.jetty.JettyServer;
import io.javaframework.web.annotation.*;
import io.javaframework.web.handler.ControllerInvoker;
import io.javaframework.web.handler.RequestHandler;
import io.javaframework.web.http.HttpMethod;
import io.javaframework.web.middleware.Middleware;
import io.javaframework.web.routing.Router;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.lang.annotation.Annotation;
import java.lang.reflect.Method;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Full implementation of the application context — orchestrates the entire framework.
 *
 * <h2>What this class does (the startup sequence):</h2>
 * <pre>
 *   1. SCAN    — Find all @Component/@Controller/@Service/@Repository classes
 *   2. DEFINE  — Create BeanDefinition for each class
 *   3. PROCESS — Register BeanPostProcessors
 *   4. INIT    — Create all non-lazy singleton beans (+ DI + @PostConstruct)
 *   5. WIRE    — Register all @Controller routes with the Router
 *   6. SERVE   — Start the embedded Jetty server
 *   7. HOOK    — Register JVM shutdown hook for graceful teardown
 * </pre>
 *
 * <h2>Spring Boot comparison:</h2>
 * Spring's {@code AbstractApplicationContext.refresh()} has 12 template method phases:
 * <ol>
 *   <li>prepareRefresh() — validate environment</li>
 *   <li>obtainFreshBeanFactory() — create DefaultListableBeanFactory</li>
 *   <li>prepareBeanFactory() — register default post-processors</li>
 *   <li>postProcessBeanFactory() — hook for subclasses</li>
 *   <li>invokeBeanFactoryPostProcessors() — modify bean definitions</li>
 *   <li>registerBeanPostProcessors() — find and order BeanPostProcessors</li>
 *   <li>initMessageSource() — i18n setup</li>
 *   <li>initApplicationEventMulticaster() — event system</li>
 *   <li>onRefresh() — hook (starts embedded server in Spring Boot!)</li>
 *   <li>registerListeners() — find ApplicationListener beans</li>
 *   <li>finishBeanFactoryInitialization() — instantiate all singletons</li>
 *   <li>finishRefresh() — publish ContextRefreshedEvent</li>
 * </ol>
 *
 * Our refresh() covers steps 1, 3, 6, 9, 11, 12 — the essential ones.
 *
 * @see io.javaframework.core.context.ApplicationContext
 * @see io.javaframework.core.bean.DefaultBeanFactory
 * @see io.javaframework.web.routing.Router
 */
public class ApplicationContextImpl implements ApplicationContext {

    private static final Logger log = LoggerFactory.getLogger(ApplicationContextImpl.class);

    // ── Configuration ─────────────────────────────────────────────────────────
    private final String applicationName;
    private final String[] basePackages;
    private final ServerConfiguration serverConfig;

    // ── Framework components (created by us, not the IoC container) ───────────
    private final DefaultBeanFactory beanFactory;
    private final ClassPathScanner scanner;
    private final Router router;
    private final JsonSerializer jsonSerializer;
    private ControllerInvoker controllerInvoker;
    private RequestHandler requestHandler;
    private EmbeddedServer embeddedServer;

    // ── State ─────────────────────────────────────────────────────────────────
    private volatile boolean active = false;
    private final long startupTime;

    // ─── Constructor ──────────────────────────────────────────────────────────

    public ApplicationContextImpl(String applicationName,
                                  String[] basePackages,
                                  ServerConfiguration serverConfig) {
        this.applicationName = applicationName;
        this.basePackages = basePackages;
        this.serverConfig = serverConfig;
        this.startupTime = System.currentTimeMillis();

        // These are framework-internal components — NOT user beans
        // They don't go through the IoC container
        this.beanFactory = new DefaultBeanFactory();
        this.scanner = new ClassPathScannerImpl();
        this.router = new Router();
        this.jsonSerializer = new JacksonJsonSerializer();
    }

    // ─── ApplicationContext implementation ────────────────────────────────────

    @Override
    public String getApplicationName() {
        return applicationName;
    }

    @Override
    public long getStartupTime() {
        return startupTime;
    }

    @Override
    public boolean isActive() {
        return active;
    }

    /**
     * The main startup method. Executes the full refresh sequence.
     *
     * <p>This is analogous to SpringApplication.run() which internally calls
     * AbstractApplicationContext.refresh().
     *
     * @throws IllegalStateException if refresh fails
     */
    @Override
    public synchronized void refresh() {
        if (active) {
            throw new IllegalStateException("ApplicationContext is already active. " +
                "Call close() before refreshing.");
        }

        log.info("Starting application context: {}", applicationName);
        long start = System.currentTimeMillis();

        // ── Phase 1: Register framework beans with the container ───────────────
        // Make core framework components available for injection in user beans
        beanFactory.registerSingleton("applicationContext", this);
        beanFactory.registerSingleton("router", router);
        beanFactory.registerSingleton("jsonSerializer", jsonSerializer);

        // ── Phase 2: Register BeanPostProcessors ──────────────────────────────
        // In production: discover @BeanPostProcessor beans via classpath scan
        // For now: register a logging post-processor
        beanFactory.addBeanPostProcessor(new LoggingBeanPostProcessor());

        // ── Phase 3: Classpath scan ────────────────────────────────────────────
        log.info("Scanning packages: {}", Arrays.toString(basePackages));
        Set<Class<?>> componentClasses = scanner.scan(basePackages);
        log.info("Found {} component classes", componentClasses.size());

        // ── Phase 4: Register BeanDefinitions ─────────────────────────────────
        for (Class<?> componentClass : componentClasses) {
            BeanDefinition definition = createBeanDefinition(componentClass);
            beanFactory.registerBeanDefinition(definition);
        }

        // ── Phase 5: Instantiate all singleton beans ───────────────────────────
        // This triggers the full DI pipeline for each singleton
        // Error here = fail fast at startup (good!)
        log.info("Instantiating singleton beans...");
        instantiateAllSingletons();

        // ── Phase 6: Register controller routes ───────────────────────────────
        log.info("Registering controller routes...");
        registerControllerRoutes();

        // ── Phase 7: Set up request handling pipeline ─────────────────────────
        controllerInvoker = new ControllerInvoker(jsonSerializer);

        // Collect registered middleware beans (in Phase 3 we'll add ordering)
        List<Middleware> middlewares = beanFactory.getBeansOfType(Middleware.class);
        log.info("Registered {} middleware(s)", middlewares.size());

        requestHandler = new RequestHandler(router, controllerInvoker, middlewares);

        // ── Phase 8: Start embedded server ────────────────────────────────────
        embeddedServer = new JettyServer(serverConfig, requestHandler);
        embeddedServer.start();

        // ── Phase 9: Register JVM shutdown hook ───────────────────────────────
        // This ensures @PreDestroy + DisposableBean.destroy() run on Ctrl+C / SIGTERM
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            log.info("JVM shutdown signal received. Starting graceful shutdown...");
            close();
        }, "framework-shutdown-hook"));

        active = true;
        long duration = System.currentTimeMillis() - start;
        log.info("Application context started in {}ms", duration);

        // Log all registered routes
        router.logRoutes();
    }

    @Override
    public void close() {
        if (!active) return;

        log.info("Closing application context: {}", applicationName);

        // Stop the server first (stop accepting new requests)
        if (embeddedServer != null && embeddedServer.isRunning()) {
            embeddedServer.stop();
        }

        // Destroy all beans (triggers @PreDestroy)
        beanFactory.destroyAll();

        active = false;
        log.info("Application context closed.");
    }

    // ─── BeanFactory delegation ───────────────────────────────────────────────
    // All BeanFactory methods delegate to DefaultBeanFactory

    @Override
    public Object getBean(String name) { return beanFactory.getBean(name); }

    @Override
    public <T> T getBean(String name, Class<T> requiredType) {
        return beanFactory.getBean(name, requiredType);
    }

    @Override
    public <T> T getBean(Class<T> requiredType) { return beanFactory.getBean(requiredType); }

    @Override
    public <T> List<T> getBeansOfType(Class<T> requiredType) {
        return beanFactory.getBeansOfType(requiredType);
    }

    @Override
    public boolean containsBean(String name) { return beanFactory.containsBean(name); }

    @Override
    public boolean isSingleton(String name) { return beanFactory.isSingleton(name); }

    @Override
    public boolean isPrototype(String name) { return beanFactory.isPrototype(name); }

    @Override
    public String[] getBeanDefinitionNames() { return beanFactory.getBeanDefinitionNames(); }

    @Override
    public Optional<BeanDefinition> getBeanDefinition(String name) {
        return beanFactory.getBeanDefinition(name);
    }

    // ─── Private startup phases ───────────────────────────────────────────────

    /**
     * Creates a BeanDefinition for a scanned component class.
     *
     * <h3>Bean name resolution:</h3>
     * 1. If @Component("myName") has a value → use "myName"
     * 2. If @Service("myService") has a value → use "myService"
     * 3. Otherwise → decapitalize class simple name (UserService → "userService")
     *
     * <h3>Primary detection:</h3>
     * If the class has @Primary, mark the definition as primary.
     * Spring uses @Primary to resolve ambiguity when multiple beans of the same type exist.
     */
    private BeanDefinition createBeanDefinition(Class<?> beanClass) {
        String beanName = resolveBeanName(beanClass);

        BeanDefinition definition = new BeanDefinition(beanName, beanClass);

        // Determine scope
        if (beanClass.isAnnotationPresent(Scope.class)) {
            definition.setScope(beanClass.getAnnotation(Scope.class).value());
        }

        // Lazy init
        // (Phase 3: add @Lazy annotation support)

        // Log what we found
        String stereotype = detectStereotype(beanClass);
        log.debug("  Creating {} definition: {} → {}", stereotype, beanClass.getSimpleName(), beanName);

        return definition;
    }

    /**
     * Resolves the bean name for a component class.
     */
    private String resolveBeanName(Class<?> beanClass) {
        // Check @Service, @Repository, @Controller for explicit names
        // They all have a value() attribute (inherited from @Component pattern)
        for (Annotation annotation : beanClass.getAnnotations()) {
            try {
                Method valueMethod = annotation.annotationType().getDeclaredMethod("value");
                String explicitName = (String) valueMethod.invoke(annotation);
                if (!StringUtils.isBlank(explicitName)) {
                    return explicitName;
                }
            } catch (NoSuchMethodException ignored) {
                // This annotation doesn't have a value() method — skip
            } catch (Exception e) {
                log.trace("Could not read value() from annotation {}", annotation.annotationType().getSimpleName());
            }
        }

        // Default: decapitalize class simple name
        return StringUtils.decapitalize(beanClass.getSimpleName());
    }

    /**
     * Instantiates all non-lazy singleton beans at startup.
     *
     * <p>This is "eager initialization" — the default in Spring.
     * Errors in bean creation are surfaced at startup, not at first request.
     * This gives you a fail-fast guarantee: if the app starts, beans are healthy.
     *
     * <h3>Order matters:</h3>
     * When BeanA depends on BeanB, BeanB must be created first.
     * Our factory handles this via recursive creation (createOrGetBean is re-entrant).
     * The circular dependency detector prevents infinite recursion.
     */
    private void instantiateAllSingletons() {
        String[] beanNames = beanFactory.getBeanDefinitionNames();
        int count = 0;

        for (String beanName : beanNames) {
            Optional<BeanDefinition> defOpt = beanFactory.getBeanDefinition(beanName);
            if (defOpt.isEmpty()) continue;

            BeanDefinition def = defOpt.get();

            if (def.isSingleton() && !def.isLazyInit()) {
                beanFactory.getBean(beanName); // triggers creation
                count++;
            }
        }

        log.info("Instantiated {} singleton beans", count);
    }

    /**
     * Scans all @Controller beans for handler methods and registers routes.
     *
     * <h3>Route discovery algorithm:</h3>
     * <ol>
     *   <li>Get all beans of type annotated with @Controller</li>
     *   <li>For each controller, get all declared methods</li>
     *   <li>For each method, check for @GetMapping, @PostMapping, etc.</li>
     *   <li>Combine controller base path + method path</li>
     *   <li>Register the route with the Router</li>
     * </ol>
     *
     * <h3>Spring comparison:</h3>
     * Spring's {@code RequestMappingHandlerMapping.detectHandlerMethods()} does this.
     * It iterates all beans in the context, checks if they have @RequestMapping
     * (directly or via meta-annotation), then finds handler methods.
     */
    private void registerControllerRoutes() {
        String[] beanNames = beanFactory.getBeanDefinitionNames();

        for (String beanName : beanNames) {
            Object bean = beanFactory.getBean(beanName);

            if (!ReflectionUtils.isMetaAnnotated(bean.getClass(), Controller.class)) {
                continue;
            }

            // Get controller-level base path (from @Controller value)
            String basePath = extractControllerBasePath(bean.getClass());

            // Scan all methods for HTTP mapping annotations
            for (Method method : bean.getClass().getDeclaredMethods()) {
                method.setAccessible(true);
                registerMethodRoute(bean, method, basePath);
            }
        }
    }

    /**
     * Registers a single method as a route if it has an HTTP mapping annotation.
     */
    private void registerMethodRoute(Object bean, Method method, String basePath) {
        // Check each HTTP method annotation
        registerIfAnnotated(bean, method, basePath, GetMapping.class, HttpMethod.GET);
        registerIfAnnotated(bean, method, basePath, PostMapping.class, HttpMethod.POST);
        registerIfAnnotated(bean, method, basePath, PutMapping.class, HttpMethod.PUT);
        registerIfAnnotated(bean, method, basePath, DeleteMapping.class, HttpMethod.DELETE);
    }

    private <A extends Annotation> void registerIfAnnotated(
            Object bean, Method method, String basePath,
            Class<A> annotationType, HttpMethod httpMethod) {

        if (!method.isAnnotationPresent(annotationType)) return;

        String methodPath = getAnnotationValue(method.getAnnotation(annotationType));
        String fullPath = io.javaframework.core.util.StringUtils.joinPaths(basePath, methodPath);

        router.register(httpMethod, fullPath, bean, method);
        log.debug("Mapped: {} {} → {}.{}()",
            httpMethod, fullPath,
            bean.getClass().getSimpleName(), method.getName());
    }

    private String extractControllerBasePath(Class<?> controllerClass) {
        Controller controllerAnnotation = controllerClass.getAnnotation(Controller.class);
        if (controllerAnnotation != null && !controllerAnnotation.value().isBlank()) {
            return controllerAnnotation.value();
        }
        return "";
    }

    /**
     * Extracts the path value from any HTTP mapping annotation via reflection.
     *
     * <p>Works because all our mapping annotations have a {@code value()} method.
     */
    private String getAnnotationValue(Annotation annotation) {
        try {
            return (String) annotation.annotationType()
                .getDeclaredMethod("value")
                .invoke(annotation);
        } catch (Exception e) {
            return "";
        }
    }

    private String detectStereotype(Class<?> cls) {
        if (cls.isAnnotationPresent(Controller.class)) return "@Controller";
        if (cls.isAnnotationPresent(Service.class)) return "@Service";
        if (cls.isAnnotationPresent(Repository.class)) return "@Repository";
        return "@Component";
    }

    // ─── Inner class: Logging post-processor ─────────────────────────────────

    /**
     * A simple BeanPostProcessor that logs each bean as it's created.
     *
     * <p>This is a great example of how cross-cutting concerns (logging)
     * are implemented as BeanPostProcessors without touching the beans themselves.
     */
    private static class LoggingBeanPostProcessor implements BeanPostProcessor {
        private static final Logger ppLog = LoggerFactory.getLogger("BeanCreation");

        @Override
        public Object postProcessAfterInitialization(Object bean, String beanName) {
            ppLog.debug("Bean ready: {} ({})", beanName, bean.getClass().getSimpleName());
            return bean;
        }
    }
}
