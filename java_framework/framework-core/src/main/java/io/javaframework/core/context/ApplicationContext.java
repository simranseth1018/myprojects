package io.javaframework.core.context;

import io.javaframework.core.bean.BeanFactory;

/**
 * Central interface for the framework's application context.
 *
 * <h2>BeanFactory vs ApplicationContext:</h2>
 * <pre>
 *   BeanFactory               ApplicationContext
 *   ─────────────────────     ──────────────────────────────────────────────
 *   getBean()                 getBean() + everything BeanFactory has
 *   Basic DI only             + Event publishing (pub/sub)
 *   Lazy init                 + Eager init of all singletons at startup
 *   No resource loading       + Resource loading (files, URLs, classpath)
 *   No i18n                   + MessageSource (internationalization)
 *   Manual setup              + Automatic BeanPostProcessor detection
 *                             + Lifecycle management (start/stop/close)
 *                             + Environment (profiles, properties)
 * </pre>
 *
 * <h2>Spring's ApplicationContext hierarchy:</h2>
 * <pre>
 *   ApplicationContext
 *     ├── ConfigurableApplicationContext
 *     │     └── AbstractApplicationContext
 *     │           ├── AnnotationConfigApplicationContext  (Java config)
 *     │           ├── ClassPathXmlApplicationContext      (XML config)
 *     │           └── GenericWebApplicationContext        (Web apps)
 *     └── WebApplicationContext                           (Web-specific)
 * </pre>
 *
 * Our hierarchy is simpler but follows the same pattern.
 *
 * @see io.javaframework.core.bean.BeanFactory
 */
public interface ApplicationContext extends BeanFactory {

    /**
     * Returns the display name of this context (for logging/debugging).
     *
     * @return the context name
     */
    String getApplicationName();

    /**
     * Returns the timestamp when this context was created.
     *
     * @return startup timestamp in milliseconds
     */
    long getStartupTime();

    /**
     * Refreshes the context: loads all bean definitions, creates all singletons.
     *
     * <p>This is the most important method — it triggers the full startup sequence:
     * <ol>
     *   <li>Scan classpath for @Component classes</li>
     *   <li>Register all BeanDefinitions</li>
     *   <li>Register BeanPostProcessors</li>
     *   <li>Instantiate all non-lazy singletons</li>
     * </ol>
     *
     * <p>In Spring, {@code AbstractApplicationContext.refresh()} is a template method
     * with 12 well-defined phases. Each phase is a separate method.
     *
     * @throws IllegalStateException if refresh fails
     */
    void refresh();

    /**
     * Closes the context, destroying all singleton beans.
     *
     * <p>This triggers @PreDestroy callbacks and DisposableBean.destroy()
     * on all singletons in reverse-creation order.
     */
    void close();

    /**
     * Returns true if this context is active (refresh() was called successfully).
     *
     * @return true if active
     */
    boolean isActive();
}
