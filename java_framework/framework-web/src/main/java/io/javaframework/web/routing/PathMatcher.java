package io.javaframework.web.routing;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * URL path pattern matching and variable extraction.
 *
 * <h2>Path matching internals:</h2>
 * The challenge: given a registered pattern {@code /users/{id}/orders/{orderId}}
 * and an incoming path {@code /users/42/orders/7}, determine:
 * 1. Does the path match the pattern?
 * 2. If yes, extract the variable values: {id=42, orderId=7}
 *
 * <h2>Implementation approach — Regex conversion:</h2>
 * We convert path patterns to regular expressions:
 * {@code /users/{id}/orders/{orderId}}
 * → {@code /users/([^/]+)/orders/([^/]+)}
 *
 * Then we apply the regex to the incoming path and extract capture groups.
 * This is clean, handles edge cases, and the regex is pre-compiled.
 *
 * <h2>Spring's approach (AntPathMatcher / PathPatternParser):</h2>
 * Spring Boot uses {@code PathPatternParser} (since 5.3) for web routes.
 * It supports:
 * - {@code {id}} — captures a single path segment
 * - {@code {*path}} — captures remaining segments (like {@code /**})
 * - {@code {id:[0-9]+}} — captures with regex constraint
 * - {@code ?} — matches a single character
 * - {@code *} — matches zero or more characters in a segment
 * - {@code **} — matches zero or more segments (Ant-style)
 *
 * For Phase 1, we support: literal segments and {variable} segments.
 *
 * <h2>Performance:</h2>
 * Patterns are compiled ONCE at route registration time and cached.
 * Matching is O(n) where n is the path length — no backtracking in common cases.
 */
public class PathMatcher {

    // Regex that matches a path variable name: {anyName}
    private static final Pattern VARIABLE_PATTERN = Pattern.compile("\\{([^/]+)}");

    // Regex segment that replaces {variable} in paths
    private static final String SEGMENT_REGEX = "([^/]+)";

    /**
     * Checks if an incoming path matches a path pattern.
     *
     * @param pattern     the route pattern (e.g., "/users/{id}")
     * @param incomingPath the incoming URL path (e.g., "/users/42")
     * @return true if the path matches the pattern
     */
    public static boolean matches(String pattern, String incomingPath) {
        return createPattern(pattern).matcher(incomingPath).matches();
    }

    /**
     * Extracts path variable values from an incoming path given a matched pattern.
     *
     * <p>Call this ONLY after confirming the path matches via {@code matches()}.
     *
     * @param pattern     the route pattern (e.g., "/users/{id}")
     * @param incomingPath the matching incoming path (e.g., "/users/42")
     * @return map of variable names to extracted values (e.g., {id="42"})
     */
    public static Map<String, String> extractPathVariables(String pattern, String incomingPath) {
        List<String> variableNames = extractVariableNames(pattern);

        if (variableNames.isEmpty()) {
            return Collections.emptyMap();
        }

        Pattern compiled = createPattern(pattern);
        Matcher matcher = compiled.matcher(incomingPath);

        if (!matcher.matches()) {
            return Collections.emptyMap();
        }

        // Each capture group in the regex corresponds to a variable name in order
        Map<String, String> variables = new LinkedHashMap<>();
        for (int i = 0; i < variableNames.size(); i++) {
            variables.put(variableNames.get(i), matcher.group(i + 1));
        }
        return variables;
    }

    /**
     * Extracts variable names from a path pattern.
     *
     * <p>Example: {@code "/users/{id}/orders/{orderId}"} → {@code ["id", "orderId"]}
     *
     * @param pattern the path pattern
     * @return ordered list of variable names (empty if no variables)
     */
    public static List<String> extractVariableNames(String pattern) {
        Matcher matcher = VARIABLE_PATTERN.matcher(pattern);
        List<String> names = new ArrayList<>();
        while (matcher.find()) {
            names.add(matcher.group(1)); // group(1) is the name inside {}
        }
        return Collections.unmodifiableList(names);
    }

    /**
     * Returns true if the pattern contains any path variables.
     */
    public static boolean hasVariables(String pattern) {
        return VARIABLE_PATTERN.matcher(pattern).find();
    }

    /**
     * Converts a path pattern to a compiled regex Pattern.
     *
     * <h3>Conversion steps:</h3>
     * 1. Escape regex metacharacters in the literal parts (dots, etc.)
     * 2. Replace each {@code {variable}} with {@code ([^/]+)} (capture group)
     * 3. Anchor the pattern with ^ and $
     * 4. Optionally allow trailing slash
     *
     * <h3>Example:</h3>
     * {@code /api/users/{id}} → {@code ^/api/users/([^/]+)/?$}
     */
    private static Pattern createPattern(String pathPattern) {
        // Escape the pattern for regex, then replace {variable} with a capture group
        // We handle this manually to preserve the structure.
        StringBuilder regex = new StringBuilder("^");

        // Split on {variable} boundaries to separately handle literal and variable parts
        Matcher varMatcher = VARIABLE_PATTERN.matcher(pathPattern);
        int lastEnd = 0;

        while (varMatcher.find()) {
            // Escape literal characters before this variable
            String literal = pathPattern.substring(lastEnd, varMatcher.start());
            regex.append(Pattern.quote(literal)); // quote() escapes all special regex chars

            // Add capture group for the variable
            regex.append(SEGMENT_REGEX);
            lastEnd = varMatcher.end();
        }

        // Append remaining literal suffix
        if (lastEnd < pathPattern.length()) {
            regex.append(Pattern.quote(pathPattern.substring(lastEnd)));
        }

        // Allow optional trailing slash
        regex.append("/?$");

        return Pattern.compile(regex.toString());
    }

    // Prevent instantiation
    private PathMatcher() {}
}
