package io.javaframework.core.annotation;

import java.lang.annotation.*;

/**
 * Marks a method to be called just before the bean is removed from the container.
 *
 * <h2>When does @PreDestroy fire?</h2>
 * When the application shuts down (JVM shutdown hook, or explicit context close).
 * The framework iterates all singleton beans in reverse-creation order and calls
 * their @PreDestroy methods before releasing them.
 *
 * <h2>Use cases:</h2>
 * <pre>{@code
 *   @Service
 *   class DatabaseConnectionPool {
 *       private ConnectionPool pool;
 *
 *       @PostConstruct
 *       public void init() {
 *           pool = new ConnectionPool(config);
 *           pool.initialize(10); // create 10 connections
 *       }
 *
 *       @PreDestroy
 *       public void shutdown() {
 *           pool.close();   // return connections, release resources
 *           log.info("Connection pool closed gracefully");
 *       }
 *   }
 * }</pre>
 *
 * <h2>Graceful shutdown (Production importance):</h2>
 * In production Kubernetes deployments:
 * 1. K8s sends SIGTERM to your pod
 * 2. JVM receives SIGTERM → triggers shutdown hooks
 * 3. Our framework's shutdown hook fires → calls @PreDestroy on all beans
 * 4. Beans release DB connections, flush caches, close sockets
 * 5. JVM exits cleanly
 *
 * Without @PreDestroy, abrupt shutdown can cause:
 * - Uncommitted transactions
 * - Orphaned DB connections (exhausting connection pool)
 * - Lost messages in queues
 * - Corrupted files
 *
 * <h2>Spring internals:</h2>
 * Handled by {@code CommonAnnotationBeanPostProcessor} (same as @PostConstruct).
 * Spring also supports {@code DisposableBean.destroy()} and
 * {@code @Bean(destroyMethod = "...")} for the same purpose.
 *
 * @see PostConstruct
 * @see io.javaframework.core.bean.DisposableBean
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface PreDestroy {
}
