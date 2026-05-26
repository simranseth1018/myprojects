package io.javaframework.core.annotation;

import java.lang.annotation.*;

/**
 * Marks a method to be called immediately after dependency injection completes.
 *
 * <h2>Why @PostConstruct?</h2>
 * Sometimes you need initialization logic that requires injected dependencies.
 * You CAN'T do this in the constructor because injection hasn't happened yet:
 *
 * <pre>{@code
 *   // WRONG — cacheService is null when constructor runs
 *   @Service
 *   class UserService {
 *       @Autowired private CacheService cacheService;
 *
 *       public UserService() {
 *           cacheService.warmUp();  // NullPointerException!
 *       }
 *   }
 * }</pre>
 *
 * Solution: use @PostConstruct
 * <pre>{@code
 *   @Service
 *   class UserService {
 *       @Autowired private CacheService cacheService;
 *
 *       @PostConstruct
 *       public void init() {
 *           cacheService.warmUp();  // OK — all dependencies injected
 *       }
 *   }
 * }</pre>
 *
 * <h2>Bean lifecycle (where @PostConstruct fits):</h2>
 * <pre>
 *   1. Constructor call
 *   2. @Autowired field injection
 *   3. BeanPostProcessor.postProcessBeforeInitialization()
 *   4. @PostConstruct method call        ← HERE
 *   5. InitializingBean.afterPropertiesSet()
 *   6. @Bean(initMethod = "...")
 *   7. BeanPostProcessor.postProcessAfterInitialization()
 *   8. Bean is ready for use
 * </pre>
 *
 * <h2>Spring internals:</h2>
 * Spring handles @PostConstruct via the
 * {@code CommonAnnotationBeanPostProcessor}. It's registered by default
 * in all AnnotationConfigApplicationContexts. It finds the annotated method
 * using reflection and calls it after injection.
 *
 * <h2>Our implementation:</h2>
 * In {@code DefaultBeanFactory}, after completing injection, we call
 * {@code ReflectionUtils.invokeAnnotatedMethods(bean, PostConstruct.class)}.
 *
 * <h2>Rules for @PostConstruct methods:</h2>
 * <ul>
 *   <li>Must be void</li>
 *   <li>Must take no parameters</li>
 *   <li>Must not be static</li>
 *   <li>Can be any access level (private is fine)</li>
 *   <li>Only one @PostConstruct per class (we enforce this)</li>
 * </ul>
 *
 * @see PreDestroy
 * @see io.javaframework.core.bean.InitializingBean
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface PostConstruct {
}
