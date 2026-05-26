package io.javaframework.web.routing;

import java.util.Collections;
import java.util.Map;

/**
 * Represents the result of a successful route matching operation.
 *
 * <h2>Why a separate match result object?</h2>
 * When the Router matches a URL like {@code /users/42} against the pattern
 * {@code /users/{id}}, it does TWO things simultaneously:
 * 1. Confirms that a route was found
 * 2. Extracts path variables ({id} → "42")
 *
 * A single return value (RouteMatch) carries both pieces of information cleanly.
 * An Optional<RouteDefinition> would lose the extracted variables.
 *
 * @see Router
 * @see RouteDefinition
 */
public record RouteMatch(
    RouteDefinition route,
    Map<String, String> pathVariables
) {
    /**
     * Canonical constructor — makes the path variables map immutable.
     */
    public RouteMatch {
        pathVariables = Collections.unmodifiableMap(pathVariables);
    }
}
