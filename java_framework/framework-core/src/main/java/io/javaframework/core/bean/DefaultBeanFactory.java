package io.javaframework.core.bean;

import io.javaframework.core.annotation.*;
import io.javaframework.core.exception.BeanCreationException;
import io.javaframework.core.exception.CircularDependencyException;
import io.javaframework.core.exception.NoSuchBeanException;
import io.javaframework.core.util.ReflectionUtils;
import io.javaframework.core.util.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.lang.reflect.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Default IoC container implementation — the heart of the framework.
 *
 * <h2>What this class does:</h2>
 * <ol>
 *   <li>Stores {@link BeanDefinition}s (blueprints for beans)</li>
 *   <li>Creates bean instances via reflection</li>
 *   <li>Injects dependencies into beans (@Autowired)</li>
 *   <li>Calls lifecycle callbacks (@PostConstruct)</li>
 *   <li>Caches singleton instances</li>
 *   <li>Destroys beans on shutdown (@PreDestroy)</li>
 * </ol>
 *
 * <h2>Spring comparison:</h2>
 * This is analogous to Spring's {@code DefaultListableBeanFactory}, which:
 * - Implements BeanFactory + ListableBeanFactory + BeanDefinitionRegistry
 * - Uses a 3-level cache for circular dependency handling
 * - Supports @Autowired, @Qualifier, @Primary, @Value, @Resource
 * - Delegates to AutowiredAnnotationBeanPostProcessor for injection
 *
 * Our implementation is simpler but follows the same structure.
 *
 * <h2>Thread safety strategy:</h2>
 * - {@code beanDefinitions}: only written at startup (single-threaded), read concurrently → HashMap OK
 * - {@code singletonCache}: written/read by multiple threads → ConcurrentHashMap
 * - Bean creation: synchronized on bean name to prevent duplicate creation
 * - {@code currentlyCreating}: ThreadLocal to detect circular deps per thread
 *
 * <h2>Memory model considerations:</h2>
 * ConcurrentHashMap guarantees visibility: once a bean is put into the cache,
 * all subsequent reads by other threads see the fully-constructed object.
 * This is critical — without proper memory visibility, a thread might see
 * a partially-constructed bean (the DCLP problem).
 *
 * <h2>Interview Questions:</h2>
 * <ul>
 *   <li>How does Spring handle circular dependencies in singleton beans?</li>
 *   <li>What is the three-level singleton cache in Spring?</li>
 *   <li>What is the double-checked locking problem in singleton creation?</li>
 *   <li>Why does Spring prefer ConcurrentHashMap over synchronized HashMap?</li>
 *   <li>What is bean instantiation vs bean initialization?</li>
 *   <li>How does Spring's @Lazy differ from prototype scope?</li>
 * </ul>
 *
 * @see BeanFactory
 * @see BeanDefinition
 */
public class DefaultBeanFactory implements BeanFactory {

    private static final Logger log = LoggerFactory.getLogger(DefaultBeanFactory.class);

    // ── Bean definition registry ───────────────────────────────────────────────
    // Written only at startup, then read-only → HashMap (no synchronization overhead)
    private final Map<String, BeanDefinition> beanDefinitions = new LinkedHashMap<>();

    // ── Singleton instance cache ───────────────────────────────────────────────
    // Key: bean name, Value: fully-initialized singleton instance
    // ConcurrentHashMap ensures visibility + atomicity for concurrent access
    private final Map<String, Object> singletonCache = new ConcurrentHashMap<>();

    // ── Creation-time state ────────────────────────────────────────────────────
    // Lock objects for per-bean synchronized creation (avoid global lock)
    private final Map<String, Object> creationLocks = new ConcurrentHashMap<>();

    // Per-thread set of bean names currently being created — for circular dep detection
    // ThreadLocal: each thread has its OWN set, so parallel bean creation is safe
    private final ThreadLocal<Set<String>> currentlyCreating =
        ThreadLocal.withInitial(LinkedHashSet::new);

    // ── Post-processors ────────────────────────────────────────────────────────
    // Ordered list of post-processors applied to every bean
    private final List<BeanPostProcessor> postProcessors = new ArrayList<>();

    // ── Destruction order tracking ─────────────────────────────────────────────
    // We destroy beans in reverse-creation order (LIFO) for proper teardown
    private final List<String> creationOrder = Collections.synchronizedList(new ArrayList<>());

    // ─── Registration ─────────────────────────────────────────────────────────

    /**
     * Registers a BeanDefinition with the container.
     *
     * <p>Must be called before any calls to getBean().
     * In Spring, this is done by BeanDefinitionReader implementations
     * during context refresh().
     *
     * @param definition the bean definition to register
     * @throws IllegalArgumentException if a bean with this name is already registered
     */
    public void registerBeanDefinition(BeanDefinition definition) {
        String name = definition.getBeanName();
        if (beanDefinitions.containsKey(name)) {
            log.warn("Overriding existing bean definition for '{}'. " +
                     "If unintentional, check for duplicate @Component classes.", name);
        }

        // Resolve the preferred constructor eagerly (at registration, not at creation)
        // This surfaces constructor problems at startup, not at first request.
        resolveConstructor(definition);

        // Find lifecycle methods
        resolveLifecycleMethods(definition);

        beanDefinitions.put(name, definition);
        log.debug("Registered bean definition: {}", definition);
    }

    /**
     * Registers a pre-existing object as a singleton bean.
     *
     * <p>Used to register the ApplicationContext itself, configuration objects,
     * or any external objects that should be available for injection.
     *
     * @param name the bean name
     * @param bean the singleton instance
     */
    public void registerSingleton(String name, Object bean) {
        singletonCache.put(name, bean);
        // Create a minimal definition for lookup purposes
        BeanDefinition def = new BeanDefinition(name, bean.getClass());
        beanDefinitions.put(name, def);
        log.debug("Registered singleton: {} ({})", name, bean.getClass().getSimpleName());
    }

    /**
     * Registers a BeanPostProcessor to be applied to all beans.
     *
     * <p>Post-processors must be registered BEFORE beans are created.
     * Spring registers its core post-processors in
     * AnnotationConfigUtils.registerAnnotationConfigProcessors().
     */
    public void addBeanPostProcessor(BeanPostProcessor postProcessor) {
        postProcessors.add(postProcessor);
    }

    // ─── BeanFactory implementation ───────────────────────────────────────────

    @Override
    public Object getBean(String name) {
        BeanDefinition definition = beanDefinitions.get(name);
        if (definition == null) {
            throw new NoSuchBeanException(name);
        }
        return createOrGetBean(definition);
    }

    @Override
    @SuppressWarnings("unchecked")
    public <T> T getBean(String name, Class<T> requiredType) {
        Object bean = getBean(name);
        if (!requiredType.isInstance(bean)) {
            throw new ClassCastException(
                "Bean '%s' is of type '%s', not '%s'"
                    .formatted(name, bean.getClass().getName(), requiredType.getName()));
        }
        return (T) bean;
    }

    @Override
    public <T> T getBean(Class<T> requiredType) {
        List<T> matching = getBeansOfType(requiredType);

        if (matching.isEmpty()) {
            throw new NoSuchBeanException(requiredType);
        }
        if (matching.size() > 1) {
            // Check for @Primary bean
            List<T> primary = matching.stream()
                .filter(b -> {
                    BeanDefinition def = findDefinitionByBean(b);
                    return def != null && def.isPrimary();
                })
                .toList();

            if (primary.size() == 1) {
                return primary.get(0);
            }

            String names = beanDefinitions.values().stream()
                .filter(d -> requiredType.isAssignableFrom(d.getBeanClass()))
                .map(BeanDefinition::getBeanName)
                .collect(Collectors.joining(", "));
            throw new NoSuchBeanException(requiredType,
                "Multiple beans found: [%s]. Use @Qualifier or mark one as @Primary".formatted(names));
        }
        return matching.get(0);
    }

    @Override
    @SuppressWarnings("unchecked")
    public <T> List<T> getBeansOfType(Class<T> requiredType) {
        return beanDefinitions.values().stream()
            // Check if the bean's class IS-A requiredType (using isAssignableFrom)
            // e.g., requiredType=UserService, beanClass=UserServiceImpl → true
            .filter(def -> requiredType.isAssignableFrom(def.getBeanClass()))
            .map(def -> (T) createOrGetBean(def))
            .collect(Collectors.toList());
    }

    @Override
    public boolean containsBean(String name) {
        return beanDefinitions.containsKey(name);
    }

    @Override
    public boolean isSingleton(String name) {
        return beanDefinitions.containsKey(name) &&
               beanDefinitions.get(name).isSingleton();
    }

    @Override
    public boolean isPrototype(String name) {
        return beanDefinitions.containsKey(name) &&
               beanDefinitions.get(name).isPrototype();
    }

    @Override
    public String[] getBeanDefinitionNames() {
        return beanDefinitions.keySet().toArray(String[]::new);
    }

    @Override
    public Optional<BeanDefinition> getBeanDefinition(String name) {
        return Optional.ofNullable(beanDefinitions.get(name));
    }

    // ─── Bean creation pipeline ───────────────────────────────────────────────

    /**
     * Core bean creation/retrieval logic.
     *
     * <h3>Singleton lifecycle:</h3>
     * <pre>
     *   1. Check singleton cache → return if found
     *   2. Detect circular dependency → throw if detected
     *   3. Instantiate (call constructor via reflection)
     *   4. Inject dependencies (@Autowired fields and setters)
     *   5. BeanPostProcessor.beforeInit()
     *   6. @PostConstruct / InitializingBean
     *   7. BeanPostProcessor.afterInit()
     *   8. Cache in singletonCache
     *   9. Return
     * </pre>
     *
     * <h3>Prototype lifecycle:</h3>
     * Steps 1 and 8 are skipped — a new instance is created every time.
     * The container does NOT track prototype beans after creation.
     */
    private Object createOrGetBean(BeanDefinition definition) {
        String beanName = definition.getBeanName();

        // ── Fast path: singleton already created ──────────────────────────────
        if (definition.isSingleton()) {
            Object cached = singletonCache.get(beanName);
            if (cached != null) {
                return cached;
            }
        }

        // ── Circular dependency detection ─────────────────────────────────────
        // Use a per-thread set to track in-progress beans on THIS call stack
        Set<String> inProgress = currentlyCreating.get();
        if (inProgress.contains(beanName)) {
            // We're trying to create a bean that's already being created on this thread
            List<String> chain = new ArrayList<>(inProgress);
            chain.add(beanName);
            throw new CircularDependencyException(chain);
        }

        // ── Per-bean lock to prevent duplicate singleton creation ─────────────
        // If two threads request the same singleton simultaneously, only ONE creates it.
        // The other waits on the lock, then finds it in the cache on the fast path.
        if (definition.isSingleton()) {
            // computeIfAbsent is atomic — ensures exactly one lock object per bean
            Object lock = creationLocks.computeIfAbsent(beanName, k -> new Object());
            synchronized (lock) {
                // Double-check: another thread may have created it while we waited
                Object cached = singletonCache.get(beanName);
                if (cached != null) {
                    return cached;
                }
                return doCreateBean(definition, inProgress);
            }
        }

        // Prototype: no locking, no caching
        return doCreateBean(definition, inProgress);
    }

    /**
     * Executes the full bean creation pipeline.
     *
     * <p>This is the inner loop of the IoC container — everything important happens here.
     */
    private Object doCreateBean(BeanDefinition definition, Set<String> inProgress) {
        String beanName = definition.getBeanName();

        // Mark as in-progress for circular dependency detection
        inProgress.add(beanName);
        log.debug("Creating bean: {}", beanName);

        try {
            // ── Phase 1: Instantiation ─────────────────────────────────────────
            // Create the raw object instance via reflection
            Object bean = instantiateBean(definition);

            // ── Phase 2: Property injection ────────────────────────────────────
            // Inject @Autowired fields and setters BEFORE calling @PostConstruct
            performFieldInjection(bean, definition);

            // ── Phase 3: BeanPostProcessor — before init ───────────────────────
            bean = applyPostProcessorsBeforeInit(bean, beanName);

            // ── Phase 4: Lifecycle callbacks ───────────────────────────────────
            invokeInitMethods(bean, definition);

            // ── Phase 5: BeanPostProcessor — after init ────────────────────────
            // THIS is where AOP proxies are created in Spring.
            // A post-processor can return a DIFFERENT object (the proxy).
            bean = applyPostProcessorsAfterInit(bean, beanName);

            // ── Phase 6: Cache singleton ───────────────────────────────────────
            if (definition.isSingleton()) {
                singletonCache.put(beanName, bean);
                creationOrder.add(beanName);
                log.debug("Singleton bean created and cached: {}", beanName);
            }

            return bean;

        } catch (BeanCreationException e) {
            throw e; // re-throw as-is
        } catch (io.javaframework.core.exception.CircularDependencyException e) {
            throw e; // re-throw circular dep exceptions unwrapped
        } catch (Exception e) {
            throw new BeanCreationException(beanName, e.getMessage(), e);
        } finally {
            // Always remove from in-progress set, even if creation fails
            inProgress.remove(beanName);
        }
    }

    // ─── Phase 1: Instantiation ───────────────────────────────────────────────

    /**
     * Creates a raw bean instance using reflection.
     *
     * <p>The preferred constructor was determined at registration time.
     * Now we need to resolve its parameter types → find matching beans → inject.
     *
     * <h3>Constructor injection:</h3>
     * This is the FIRST and most important form of injection.
     * Constructor injection makes dependencies explicit and final.
     *
     * <h3>JVM note on reflection:</h3>
     * {@code constructor.newInstance(args)} triggers the JVM to:
     * 1. Allocate memory for the object
     * 2. Call the constructor bytecode
     * 3. Return the reference
     * The first ~15 calls use a slow interpreted path; after that,
     * the JVM compiles a faster native accessor.
     */
    private Object instantiateBean(BeanDefinition definition) {
        Constructor<?> constructor = definition.getPreferredConstructor();

        if (constructor.getParameterCount() == 0) {
            // Simple no-arg constructor
            return ReflectionUtils.instantiate(constructor, new Object[0]);
        }

        // Constructor has parameters — each must be resolved from the container
        Parameter[] params = constructor.getParameters();
        Object[] args = new Object[params.length];

        for (int i = 0; i < params.length; i++) {
            args[i] = resolveParameter(params[i], definition.getBeanName());
        }

        return ReflectionUtils.instantiate(constructor, args);
    }

    /**
     * Resolves a constructor or method parameter to its bean value.
     *
     * <h3>Resolution algorithm:</h3>
     * <ol>
     *   <li>If @Qualifier present → look up by name</li>
     *   <li>Otherwise → look up by type (Class)</li>
     *   <li>If required and not found → throw NoSuchBeanException</li>
     *   <li>If not required and not found → return null</li>
     * </ol>
     */
    private Object resolveParameter(Parameter param, String injectingBeanName) {
        // Check for @Qualifier on parameter
        if (param.isAnnotationPresent(Qualifier.class)) {
            String qualifierName = param.getAnnotation(Qualifier.class).value();
            return getBean(qualifierName);
        }

        // Check for @Autowired(required = false) on parameter
        boolean required = true;
        if (param.isAnnotationPresent(Autowired.class)) {
            required = param.getAnnotation(Autowired.class).required();
        }

        // Look up by type
        Class<?> paramType = param.getType();
        try {
            return getBean(paramType);
        } catch (NoSuchBeanException e) {
            if (!required) {
                log.debug("Optional dependency of type '{}' not found for bean '{}', injecting null",
                    paramType.getSimpleName(), injectingBeanName);
                return null;
            }
            throw e;
        }
    }

    // ─── Phase 2: Field injection ─────────────────────────────────────────────

    /**
     * Performs @Autowired field injection on a bean instance.
     *
     * <h3>Why field injection?</h3>
     * Some frameworks (like Spring) support @Autowired on private fields.
     * While we discourage it for application code, we support it because:
     * 1. Legacy code compatibility
     * 2. Sometimes the class hierarchy prevents constructor injection
     * 3. Educational completeness
     *
     * <h3>Implementation note:</h3>
     * We use {@code field.setAccessible(true)} to bypass the private modifier.
     * This is legal in Java but may require --add-opens in Java 9+ modules.
     * Spring does the same thing.
     */
    private void performFieldInjection(Object bean, BeanDefinition definition) {
        List<java.lang.reflect.Field> autowiredFields =
            ReflectionUtils.findAnnotatedFields(bean.getClass(), Autowired.class);

        for (java.lang.reflect.Field field : autowiredFields) {
            Autowired autowired = field.getAnnotation(Autowired.class);
            boolean required = autowired.required();

            Object dependency;

            // Check if field also has @Qualifier
            if (field.isAnnotationPresent(Qualifier.class)) {
                String qualifierName = field.getAnnotation(Qualifier.class).value();
                dependency = getBean(qualifierName);
            } else {
                // Look up by field type
                try {
                    dependency = getBean(field.getType());
                } catch (NoSuchBeanException e) {
                    if (!required) {
                        log.debug("Optional @Autowired field '{}' in '{}' not satisfied, leaving null",
                            field.getName(), bean.getClass().getSimpleName());
                        continue;
                    }
                    throw new BeanCreationException(
                        definition.getBeanName(),
                        "Cannot satisfy @Autowired field '%s' of type '%s'"
                            .formatted(field.getName(), field.getType().getName()),
                        e);
                }
            }

            ReflectionUtils.setField(field, bean, dependency);
            log.debug("Field injection: {}.{} = {}", bean.getClass().getSimpleName(),
                field.getName(), dependency.getClass().getSimpleName());
        }
    }

    // ─── Phase 3 & 5: BeanPostProcessors ─────────────────────────────────────

    private Object applyPostProcessorsBeforeInit(Object bean, String beanName) {
        Object result = bean;
        for (BeanPostProcessor processor : postProcessors) {
            result = processor.postProcessBeforeInitialization(result, beanName);
            if (result == null) {
                log.warn("BeanPostProcessor {} returned null for bean '{}', using original",
                    processor.getClass().getSimpleName(), beanName);
                result = bean;
            }
        }
        return result;
    }

    private Object applyPostProcessorsAfterInit(Object bean, String beanName) {
        Object result = bean;
        for (BeanPostProcessor processor : postProcessors) {
            result = processor.postProcessAfterInitialization(result, beanName);
            if (result == null) {
                log.warn("BeanPostProcessor {} returned null for bean '{}', using original",
                    processor.getClass().getSimpleName(), beanName);
                result = bean;
            }
        }
        return result;
    }

    // ─── Phase 4: Lifecycle callbacks ─────────────────────────────────────────

    /**
     * Invokes @PostConstruct method and InitializingBean.afterPropertiesSet().
     *
     * <h3>Order (matching Spring's behavior):</h3>
     * <ol>
     *   <li>@PostConstruct (annotation-driven)</li>
     *   <li>InitializingBean.afterPropertiesSet() (interface-driven)</li>
     * </ol>
     */
    private void invokeInitMethods(Object bean, BeanDefinition definition) {
        // @PostConstruct methods
        Method initMethod = definition.getInitMethod();
        if (initMethod != null) {
            log.debug("Invoking @PostConstruct on: {}", definition.getBeanName());
            ReflectionUtils.invokeMethod(initMethod, bean);
        }

        // InitializingBean interface
        if (bean instanceof InitializingBean initializingBean) {
            log.debug("Calling afterPropertiesSet() on: {}", definition.getBeanName());
            try {
                initializingBean.afterPropertiesSet();
            } catch (Exception e) {
                throw new BeanCreationException(
                    definition.getBeanName(),
                    "afterPropertiesSet() threw exception", e);
            }
        }
    }

    // ─── Shutdown / Destruction ───────────────────────────────────────────────

    /**
     * Destroys all singleton beans in reverse creation order.
     *
     * <p>Called by the application context shutdown hook.
     * Beans created last are destroyed first (LIFO — dependency-aware teardown).
     *
     * <h3>Why reverse order?</h3>
     * If BeanA depends on BeanB, BeanA was created after BeanB.
     * Destroying BeanA first means BeanA can use BeanB in its @PreDestroy.
     * If we destroyed BeanB first, BeanA's @PreDestroy would get NPEs.
     */
    public void destroyAll() {
        log.info("Destroying {} singleton beans...", creationOrder.size());

        // Destroy in reverse creation order
        List<String> reverseOrder = new ArrayList<>(creationOrder);
        Collections.reverse(reverseOrder);

        for (String beanName : reverseOrder) {
            Object bean = singletonCache.get(beanName);
            if (bean == null) continue;

            BeanDefinition def = beanDefinitions.get(beanName);

            // @PreDestroy
            try {
                Method destroyMethod = def != null ? def.getDestroyMethod() : null;
                if (destroyMethod != null) {
                    log.debug("Invoking @PreDestroy on: {}", beanName);
                    ReflectionUtils.invokeMethod(destroyMethod, bean);
                }
            } catch (Exception e) {
                log.warn("Exception during @PreDestroy on bean '{}': {}", beanName, e.getMessage());
            }

            // DisposableBean interface
            if (bean instanceof DisposableBean disposable) {
                try {
                    log.debug("Calling destroy() on: {}", beanName);
                    disposable.destroy();
                } catch (Exception e) {
                    log.warn("Exception during destroy() on bean '{}': {}", beanName, e.getMessage());
                }
            }
        }

        singletonCache.clear();
        log.info("All beans destroyed.");
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    /**
     * Resolves and caches the preferred constructor in the BeanDefinition.
     * Done at registration time for fail-fast behavior.
     */
    private void resolveConstructor(BeanDefinition definition) {
        try {
            Constructor<?> constructor = ReflectionUtils.findPreferredConstructor(definition.getBeanClass());
            definition.setPreferredConstructor(constructor);
        } catch (Exception e) {
            throw new BeanCreationException(
                definition.getBeanName(),
                "Failed to resolve constructor: " + e.getMessage(), e);
        }
    }

    /**
     * Finds and stores @PostConstruct and @PreDestroy methods in the BeanDefinition.
     */
    private void resolveLifecycleMethods(BeanDefinition definition) {
        Class<?> beanClass = definition.getBeanClass();

        // @PostConstruct
        List<Method> initMethods = ReflectionUtils.findAnnotatedMethods(beanClass, PostConstruct.class);
        if (initMethods.size() > 1) {
            throw new BeanCreationException(definition.getBeanName(),
                "Multiple @PostConstruct methods found. Only one is allowed.");
        }
        if (!initMethods.isEmpty()) {
            definition.setInitMethod(initMethods.get(0));
        }

        // @PreDestroy
        List<Method> destroyMethods = ReflectionUtils.findAnnotatedMethods(beanClass, PreDestroy.class);
        if (destroyMethods.size() > 1) {
            throw new BeanCreationException(definition.getBeanName(),
                "Multiple @PreDestroy methods found. Only one is allowed.");
        }
        if (!destroyMethods.isEmpty()) {
            definition.setDestroyMethod(destroyMethods.get(0));
        }
    }

    /**
     * Finds the BeanDefinition for a given bean instance.
     * Used for @Primary resolution.
     */
    private BeanDefinition findDefinitionByBean(Object bean) {
        return beanDefinitions.values().stream()
            .filter(def -> def.getBeanClass().equals(bean.getClass()))
            .findFirst()
            .orElse(null);
    }

    // ─── Container statistics ─────────────────────────────────────────────────

    /**
     * Returns a summary of the container state for debugging/health-checks.
     */
    public String getContainerSummary() {
        long singletons = beanDefinitions.values().stream()
            .filter(BeanDefinition::isSingleton).count();
        long prototypes = beanDefinitions.values().stream()
            .filter(BeanDefinition::isPrototype).count();

        return """
            === IoC Container Summary ===
            Registered beans: %d
              - Singletons: %d
              - Prototypes: %d
            Cached singletons: %d
            Post-processors: %d
            """.formatted(
                beanDefinitions.size(), singletons, prototypes,
                singletonCache.size(), postProcessors.size());
    }
}
