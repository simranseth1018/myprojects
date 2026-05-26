package io.javaframework.core.bean;

import io.javaframework.core.annotation.Autowired;
import io.javaframework.core.annotation.Component;
import io.javaframework.core.annotation.PostConstruct;
import io.javaframework.core.exception.CircularDependencyException;
import io.javaframework.core.exception.NoSuchBeanException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.*;

/**
 * Unit tests for DefaultBeanFactory.
 *
 * <h2>Testing philosophy:</h2>
 * These tests verify the IoC container's behavior in isolation.
 * No actual classpath scanning — we manually register definitions
 * to keep tests fast and focused.
 *
 * <h2>What we test:</h2>
 * - Basic bean creation (no dependencies)
 * - Singleton caching (same instance returned every time)
 * - Constructor injection (dependencies resolved from container)
 * - @PostConstruct lifecycle callback
 * - getBeansOfType (returns all implementations of an interface)
 * - Circular dependency detection
 * - NoSuchBeanException for missing beans
 */
@DisplayName("DefaultBeanFactory")
class DefaultBeanFactoryTest {

    private DefaultBeanFactory factory;

    @BeforeEach
    void setUp() {
        factory = new DefaultBeanFactory();
    }

    // ─── Test beans (static inner classes for isolation) ──────────────────────

    @Component
    static class SimpleBean {
        boolean initCalled = false;

        @PostConstruct
        void init() {
            initCalled = true;
        }
    }

    @Component
    static class DependencyBean {}

    @Component
    static class BeanWithDependency {
        final DependencyBean dependency;

        @Autowired
        BeanWithDependency(DependencyBean dependency) {
            this.dependency = dependency;
        }
    }

    interface AnimalService {}

    @Component
    static class DogService implements AnimalService {}

    @Component
    static class CatService implements AnimalService {}

    // Circular dependency test beans
    @Component
    static class CircularA {
        @Autowired
        CircularA(CircularB b) {}
    }

    @Component
    static class CircularB {
        @Autowired
        CircularB(CircularA a) {}
    }

    // ─── Tests ────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("creates a simple bean with no dependencies")
    void createSimpleBean() {
        factory.registerBeanDefinition(new BeanDefinition("simpleBean", SimpleBean.class));

        Object bean = factory.getBean("simpleBean");

        assertThat(bean).isNotNull().isInstanceOf(SimpleBean.class);
    }

    @Test
    @DisplayName("singletons return the same instance on every call")
    void singletonReturnsSameInstance() {
        factory.registerBeanDefinition(new BeanDefinition("simpleBean", SimpleBean.class));

        Object first = factory.getBean("simpleBean");
        Object second = factory.getBean("simpleBean");

        assertThat(first).isSameAs(second);
    }

    @Test
    @DisplayName("calls @PostConstruct after creation")
    void callsPostConstruct() {
        factory.registerBeanDefinition(new BeanDefinition("simpleBean", SimpleBean.class));

        SimpleBean bean = factory.getBean("simpleBean", SimpleBean.class);

        assertThat(bean.initCalled).isTrue();
    }

    @Test
    @DisplayName("injects dependencies via constructor")
    void injectsConstructorDependencies() {
        factory.registerBeanDefinition(new BeanDefinition("dependencyBean", DependencyBean.class));
        factory.registerBeanDefinition(new BeanDefinition("beanWithDependency", BeanWithDependency.class));

        BeanWithDependency bean = factory.getBean("beanWithDependency", BeanWithDependency.class);

        assertThat(bean.dependency).isNotNull().isInstanceOf(DependencyBean.class);
    }

    @Test
    @DisplayName("getBeansOfType returns all implementations of an interface")
    void getBeansOfTypeReturnsAllImplementations() {
        factory.registerBeanDefinition(new BeanDefinition("dogService", DogService.class));
        factory.registerBeanDefinition(new BeanDefinition("catService", CatService.class));

        List<AnimalService> animals = factory.getBeansOfType(AnimalService.class);

        assertThat(animals).hasSize(2);
        assertThat(animals).hasAtLeastOneElementOfType(DogService.class);
        assertThat(animals).hasAtLeastOneElementOfType(CatService.class);
    }

    @Test
    @DisplayName("getBean by type returns the unique bean of that type")
    void getBeanByType() {
        factory.registerBeanDefinition(new BeanDefinition("simpleBean", SimpleBean.class));

        SimpleBean bean = factory.getBean(SimpleBean.class);

        assertThat(bean).isNotNull();
    }

    @Test
    @DisplayName("throws NoSuchBeanException for unknown bean name")
    void throwsNoSuchBeanForUnknownName() {
        assertThatThrownBy(() -> factory.getBean("nonExistentBean"))
            .isInstanceOf(NoSuchBeanException.class)
            .hasMessageContaining("nonExistentBean");
    }

    @Test
    @DisplayName("throws NoSuchBeanException for unregistered type")
    void throwsNoSuchBeanForUnknownType() {
        assertThatThrownBy(() -> factory.getBean(SimpleBean.class))
            .isInstanceOf(NoSuchBeanException.class);
    }

    @Test
    @DisplayName("detects circular dependency and throws CircularDependencyException")
    void detectsCircularDependency() {
        factory.registerBeanDefinition(new BeanDefinition("circularA", CircularA.class));
        factory.registerBeanDefinition(new BeanDefinition("circularB", CircularB.class));

        assertThatThrownBy(() -> factory.getBean("circularA"))
            .isInstanceOf(CircularDependencyException.class);
    }

    @Test
    @DisplayName("containsBean returns true for registered beans")
    void containsBeanReturnsTrueForRegistered() {
        factory.registerBeanDefinition(new BeanDefinition("simpleBean", SimpleBean.class));

        assertThat(factory.containsBean("simpleBean")).isTrue();
        assertThat(factory.containsBean("unknownBean")).isFalse();
    }

    @Test
    @DisplayName("prototype beans return different instances each time")
    void prototypeScopeReturnsDifferentInstances() {
        BeanDefinition def = new BeanDefinition("protoBean", SimpleBean.class);
        def.setScope(BeanScope.PROTOTYPE);
        factory.registerBeanDefinition(def);

        Object first = factory.getBean("protoBean");
        Object second = factory.getBean("protoBean");

        assertThat(first).isNotSameAs(second);
    }
}
