package io.javaframework.core.bean;

import java.util.List;
import java.util.Optional;

/**
 * Root interface for the IoC container — provides bean retrieval.
 *
 * <h2>What is a BeanFactory?</h2>
 * BeanFactory is the "interface contract" for an IoC container.
 * Anything that can create and store beans IS a BeanFactory.
 *
 * <h2>Spring's BeanFactory hierarchy:</h2>
 * <pre>
 *   BeanFactory                          ← minimal: getBean()
 *     └── ListableBeanFactory            ← adds: getBeansOfType(), getBeanNames()
 *           └── ConfigurableBeanFactory  ← adds: registerBeanDefinition()
 *                 └── ApplicationContext ← adds: events, i18n, resources
 * </pre>
 *
 * We follow the same hierarchy in our framework.
 *
 * <h2>BeanFactory vs ApplicationContext:</h2>
 * BeanFactory: minimal, lazy — beans created on first getBean() call.
 * ApplicationContext: eager — all singleton beans created at startup.
 * ApplicationContext also supports: events, i18n, AOP, environment.
 *
 * For production applications, ALWAYS use ApplicationContext.
 * BeanFactory is useful for embedded/resource-constrained environments.
 *
 * <h2>Thread safety:</h2>
 * Implementations MUST be thread-safe. Multiple threads may call getBean()
 * concurrently. Our DefaultBeanFactory uses ConcurrentHashMap for the
 * singleton cache and synchronized blocks for bean creation.
 *
 * @see DefaultBeanFactory
 * @see io.javaframework.core.context.ApplicationContext
 */
public interface BeanFactory {

    /**
     * Returns the bean registered under the given name.
     *
     * @param name the bean's registered name
     * @return the bean instance
     * @throws io.javaframework.core.exception.NoSuchBeanException if no bean exists
     */
    Object getBean(String name);

    /**
     * Returns the bean registered under the given name, cast to the expected type.
     *
     * <h2>Why the type parameter?</h2>
     * Without it, you'd need an explicit cast:
     * {@code UserService s = (UserService) factory.getBean("userService");}
     *
     * With it, the cast is done by the factory and checked:
     * {@code UserService s = factory.getBean("userService", UserService.class);}
     *
     * If the actual bean type doesn't match, a ClassCastException is thrown early.
     *
     * @param name         the bean's registered name
     * @param requiredType the expected type
     * @param <T>          the type parameter
     * @return the bean instance cast to T
     * @throws io.javaframework.core.exception.NoSuchBeanException if no bean exists
     * @throws ClassCastException                                   if types don't match
     */
    <T> T getBean(String name, Class<T> requiredType);

    /**
     * Returns the unique bean of the given type.
     *
     * <p>If multiple beans of this type exist, throws an exception.
     * Use {@code getBeansOfType()} to retrieve all of them.
     *
     * @param requiredType the bean's type or interface
     * @param <T>          the type parameter
     * @return the unique bean instance
     * @throws io.javaframework.core.exception.NoSuchBeanException          if none found
     * @throws io.javaframework.core.exception.BeanCreationException        if multiple found
     */
    <T> T getBean(Class<T> requiredType);

    /**
     * Returns all beans assignable to the given type.
     *
     * <p>Useful when you have multiple implementations of an interface
     * and want to process all of them (e.g., all event listeners, all validators).
     *
     * @param requiredType the type to look up
     * @param <T>          the type parameter
     * @return list of matching bean instances (empty if none)
     */
    <T> List<T> getBeansOfType(Class<T> requiredType);

    /**
     * Returns whether a bean with the given name is registered.
     *
     * @param name the bean name to check
     * @return true if a bean with this name exists
     */
    boolean containsBean(String name);

    /**
     * Returns whether the named bean is a singleton.
     *
     * @param name the bean name
     * @return true if the bean is a singleton
     */
    boolean isSingleton(String name);

    /**
     * Returns whether the named bean is a prototype.
     *
     * @param name the bean name
     * @return true if the bean is a prototype
     */
    boolean isPrototype(String name);

    /**
     * Returns all registered bean names.
     *
     * @return array of bean names
     */
    String[] getBeanDefinitionNames();

    /**
     * Returns the BeanDefinition for the given name, if present.
     *
     * @param name the bean name
     * @return the definition, or empty if not registered
     */
    Optional<BeanDefinition> getBeanDefinition(String name);
}
