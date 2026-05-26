package io.javaframework.core.exception;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Thrown when a circular dependency is detected during bean creation.
 *
 * <h2>What is a circular dependency?</h2>
 * BeanA needs BeanB in its constructor.
 * BeanB needs BeanA in its constructor.
 * The container cannot create either without the other existing first.
 *
 * <h2>Detection algorithm:</h2>
 * We maintain a {@code Set<String> currentlyCreating} (beans in-progress).
 * Before creating bean X:
 *   1. If X is in currentlyCreating → circular dependency → throw this exception
 *   2. Add X to currentlyCreating
 *   3. Create X (which may trigger creation of its dependencies)
 *   4. Remove X from currentlyCreating
 *
 * <h2>How Spring handles this:</h2>
 * Spring ONLY allows circular dependencies via setter/field injection (not constructor).
 * It uses a "three-level cache" (singletonObjects, earlySingletonObjects, singletonFactories)
 * to handle circular deps with setter injection by injecting an "early reference" (incomplete bean).
 *
 * For constructor injection circular deps, Spring throws
 * BeanCurrentlyInCreationException — the only correct answer.
 *
 * <h2>The fix:</h2>
 * 1. Redesign: extract the shared dependency into a third class.
 * 2. Use setter injection for one side (makes the dep optional/mutable).
 * 3. Rethink your architecture — circular deps often indicate a design flaw.
 */
public class CircularDependencyException extends RuntimeException {

    private final List<String> dependencyChain;

    public CircularDependencyException(List<String> dependencyChain) {
        super(buildMessage(dependencyChain));
        this.dependencyChain = List.copyOf(dependencyChain);
    }

    private static String buildMessage(List<String> chain) {
        String chainStr = chain.stream().collect(Collectors.joining(" → "));
        return "Circular dependency detected: %s → [CYCLE]".formatted(chainStr);
    }

    public List<String> getDependencyChain() {
        return dependencyChain;
    }
}
