package io.javaframework.core.bean;

import java.lang.reflect.Constructor;
import java.lang.reflect.Method;
import java.util.Objects;

/**
 * Metadata descriptor for a bean managed by the IoC container.
 *
 * <h2>What is a BeanDefinition?</h2>
 * A BeanDefinition is NOT the bean itself — it's the "blueprint" or "recipe"
 * for creating and configuring a bean. Think of it like a class vs an object:
 * BeanDefinition is the class, the actual bean instance is the object.
 *
 * <h2>Spring comparison:</h2>
 * Spring's {@code BeanDefinition} interface has 20+ methods. Its concrete
 * implementation {@code GenericBeanDefinition} / {@code RootBeanDefinition}
 * stores: beanClass, scope, lazyInit, constructorArgs, propertyValues,
 * initMethodName, destroyMethodName, dependsOn, primary, abstract, etc.
 *
 * Our BeanDefinition is simpler but captures the same essential information.
 *
 * <h2>When is BeanDefinition created?</h2>
 * 1. ClassPathScanner scans for @Component-annotated classes
 * 2. For each found class, a BeanDefinition is created
 * 3. All BeanDefinitions are registered with the BeanFactory
 * 4. When a bean is first requested, the factory uses the definition to create it
 *
 * <h2>Lazy vs Eager initialization:</h2>
 * - Eager (default): All singleton beans are created at startup.
 *   Pros: Fail-fast (startup fails if wiring is broken)
 *   Cons: Slower startup, more memory at launch
 * - Lazy: Bean created only when first requested via getBean()
 *   Pros: Faster startup, only used beans are created
 *   Cons: Wiring errors discovered at request time, not startup
 *
 * @see BeanFactory
 * @see BeanScope
 */
public class BeanDefinition {

    // ── Core identity ──────────────────────────────────────────────────────────

    /** The registered name of this bean in the container. E.g., "userService". */
    private final String beanName;

    /** The class this bean is created from. E.g., UserService.class. */
    private final Class<?> beanClass;

    // ── Lifecycle configuration ────────────────────────────────────────────────

    /**
     * The scope of this bean.
     * Defaults to "singleton" — one instance per container.
     *
     * @see BeanScope
     */
    private String scope = BeanScope.SINGLETON;

    /**
     * Whether to defer creation of this bean until first use.
     * Defaults to false (eager initialization at startup).
     */
    private boolean lazyInit = false;

    /**
     * Whether this bean is the primary candidate when multiple beans of the
     * same type exist. Equivalent to Spring's @Primary.
     */
    private boolean primary = false;

    // ── Constructor resolution ─────────────────────────────────────────────────

    /**
     * The constructor to use for creating this bean instance.
     * Null means use the default no-arg constructor.
     *
     * <p>This is resolved by the factory during definition registration.
     * We look for:
     * 1. A constructor annotated with @Autowired
     * 2. If only one constructor exists, use it
     * 3. Otherwise, fall back to no-arg constructor
     */
    private Constructor<?> preferredConstructor;

    // ── Lifecycle callbacks ────────────────────────────────────────────────────

    /**
     * The @PostConstruct method to call after injection.
     * Null if no @PostConstruct method exists.
     */
    private Method initMethod;

    /**
     * The @PreDestroy method to call before bean removal.
     * Null if no @PreDestroy method exists.
     */
    private Method destroyMethod;

    // ─── Constructor ──────────────────────────────────────────────────────────

    /**
     * Creates a new BeanDefinition for the given class.
     *
     * @param beanName  the registered name for this bean
     * @param beanClass the class to instantiate
     * @throws NullPointerException if beanName or beanClass is null
     */
    public BeanDefinition(String beanName, Class<?> beanClass) {
        this.beanName = Objects.requireNonNull(beanName, "beanName must not be null");
        this.beanClass = Objects.requireNonNull(beanClass, "beanClass must not be null");
    }

    // ─── Accessors ────────────────────────────────────────────────────────────

    public String getBeanName() {
        return beanName;
    }

    public Class<?> getBeanClass() {
        return beanClass;
    }

    public String getScope() {
        return scope;
    }

    public void setScope(String scope) {
        this.scope = Objects.requireNonNull(scope, "scope must not be null");
    }

    public boolean isSingleton() {
        return BeanScope.SINGLETON.equals(scope);
    }

    public boolean isPrototype() {
        return BeanScope.PROTOTYPE.equals(scope);
    }

    public boolean isLazyInit() {
        return lazyInit;
    }

    public void setLazyInit(boolean lazyInit) {
        this.lazyInit = lazyInit;
    }

    public boolean isPrimary() {
        return primary;
    }

    public void setPrimary(boolean primary) {
        this.primary = primary;
    }

    public Constructor<?> getPreferredConstructor() {
        return preferredConstructor;
    }

    public void setPreferredConstructor(Constructor<?> preferredConstructor) {
        this.preferredConstructor = preferredConstructor;
    }

    public Method getInitMethod() {
        return initMethod;
    }

    public void setInitMethod(Method initMethod) {
        this.initMethod = initMethod;
    }

    public Method getDestroyMethod() {
        return destroyMethod;
    }

    public void setDestroyMethod(Method destroyMethod) {
        this.destroyMethod = destroyMethod;
    }

    // ─── Object methods ───────────────────────────────────────────────────────

    @Override
    public String toString() {
        return "BeanDefinition{name='%s', class=%s, scope='%s', lazy=%s}"
                .formatted(beanName, beanClass.getSimpleName(), scope, lazyInit);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof BeanDefinition that)) return false;
        return Objects.equals(beanName, that.beanName) &&
               Objects.equals(beanClass, that.beanClass);
    }

    @Override
    public int hashCode() {
        return Objects.hash(beanName, beanClass);
    }
}
