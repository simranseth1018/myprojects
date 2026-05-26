package io.javaframework.core.bean;

/**
 * Extension point to intercept bean creation and apply cross-cutting concerns.
 *
 * <h2>What is a BeanPostProcessor?</h2>
 * A hook that runs BEFORE and AFTER every bean's initialization.
 * It allows the framework (or users) to modify or wrap beans without
 * changing their source code. This is the "Open/Closed Principle" in action:
 * beans are open for extension (via post-processors) but closed for modification.
 *
 * <h2>Spring's critical BeanPostProcessors:</h2>
 * <ul>
 *   <li>{@code AutowiredAnnotationBeanPostProcessor} — processes @Autowired injection</li>
 *   <li>{@code CommonAnnotationBeanPostProcessor} — processes @PostConstruct, @PreDestroy</li>
 *   <li>{@code AnnotationAwareAspectJAutoProxyCreator} — creates AOP proxies for @Aspect</li>
 *   <li>{@code PersistenceAnnotationBeanPostProcessor} — processes @PersistenceContext</li>
 * </ul>
 *
 * <h2>How AOP (proxying) works via BeanPostProcessor:</h2>
 * When Spring sees a @Transactional method, the
 * {@code AbstractAutoProxyCreator} (a BeanPostProcessor) intercepts
 * {@code postProcessAfterInitialization()} and replaces the original bean
 * with a CGLIB proxy. The proxy wraps every method call in transaction logic.
 * This is why Spring AOP works transparently — the caller doesn't know it's
 * talking to a proxy.
 *
 * <h2>Execution order in the bean lifecycle:</h2>
 * <pre>
 *   constructor()
 *   @Autowired injection
 *   │
 *   ├── postProcessBeforeInitialization()  ← BEFORE @PostConstruct
 *   ├── @PostConstruct method
 *   ├── InitializingBean.afterPropertiesSet()
 *   └── postProcessAfterInitialization()   ← AFTER init, can return a proxy
 * </pre>
 *
 * <h2>Our implementation plan:</h2>
 * Phase 1: Simple logging post-processor.
 * Phase 3: Validation post-processor.
 * Phase 5: Security proxy post-processor.
 *
 * @see InitializingBean
 * @see DisposableBean
 */
public interface BeanPostProcessor {

    /**
     * Called BEFORE the bean's @PostConstruct method.
     *
     * <p>Return the original bean, or a modified/wrapped version.
     * If you return null, the original bean is used (but returning null is discouraged).
     *
     * @param bean     the newly created bean instance (before initialization)
     * @param beanName the bean's registered name
     * @return the (possibly modified) bean instance
     */
    default Object postProcessBeforeInitialization(Object bean, String beanName) {
        // Default: no-op, return bean unchanged
        return bean;
    }

    /**
     * Called AFTER the bean's @PostConstruct method.
     *
     * <p>This is the most important hook for AOP proxying.
     * If you return a proxy here, ALL callers receive the proxy — they never
     * see the original bean.
     *
     * @param bean     the initialized bean instance
     * @param beanName the bean's registered name
     * @return the (possibly proxied) bean to use
     */
    default Object postProcessAfterInitialization(Object bean, String beanName) {
        // Default: no-op, return bean unchanged
        return bean;
    }
}
