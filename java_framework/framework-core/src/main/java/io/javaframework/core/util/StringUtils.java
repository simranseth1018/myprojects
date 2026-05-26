package io.javaframework.core.util;

/**
 * String utility methods for framework-internal use.
 *
 * <p>Centralizes common string operations to avoid scattering null checks
 * and string manipulation throughout the codebase.
 */
public final class StringUtils {

    private StringUtils() {
        throw new UnsupportedOperationException("Utility class");
    }

    /**
     * Returns true if the string is null or contains only whitespace.
     */
    public static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    /**
     * Returns true if the string has content (non-null, non-blank).
     */
    public static boolean hasText(String s) {
        return !isBlank(s);
    }

    /**
     * Converts a class's simple name to camelCase bean name.
     *
     * <p>Examples:
     * <ul>
     *   <li>{@code UserService} → {@code "userService"}</li>
     *   <li>{@code HTTPClient} → {@code "HTTPClient"} (preserves all-caps acronyms)</li>
     *   <li>{@code U} → {@code "u"}</li>
     * </ul>
     *
     * <h3>Spring's behavior:</h3>
     * Spring uses {@code Introspector.decapitalize()} which lowercases only the
     * first character UNLESS the second character is also uppercase (then leaves as-is).
     * Example: {@code "URL"} stays {@code "URL"}, not {@code "uRL"}.
     *
     * @param className the class's simple name
     * @return the default bean name
     */
    public static String decapitalize(String className) {
        if (isBlank(className)) return className;
        if (className.length() == 1) return className.toLowerCase();

        // If first two chars are uppercase (acronym), leave as-is
        if (Character.isUpperCase(className.charAt(0)) &&
            Character.isUpperCase(className.charAt(1))) {
            return className;
        }

        // Lowercase the first character only
        return Character.toLowerCase(className.charAt(0)) + className.substring(1);
    }

    /**
     * Normalizes a URL path — ensures single leading slash, no trailing slash.
     *
     * <p>Examples:
     * <ul>
     *   <li>{@code "users"} → {@code "/users"}</li>
     *   <li>{@code "/users/"} → {@code "/users"}</li>
     *   <li>{@code ""} → {@code "/"}</li>
     * </ul>
     */
    public static String normalizePath(String path) {
        if (isBlank(path) || path.equals("/")) return "/";

        String normalized = path.trim();

        // Ensure leading slash
        if (!normalized.startsWith("/")) {
            normalized = "/" + normalized;
        }

        // Remove trailing slash (except root)
        if (normalized.length() > 1 && normalized.endsWith("/")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }

        return normalized;
    }

    /**
     * Combines two path segments, handling slashes correctly.
     *
     * <p>Examples:
     * <ul>
     *   <li>{@code ("/api", "users")} → {@code "/api/users"}</li>
     *   <li>{@code ("/api/", "/users")} → {@code "/api/users"}</li>
     *   <li>{@code ("", "/users")} → {@code "/users"}</li>
     * </ul>
     */
    public static String joinPaths(String base, String path) {
        String normalBase = normalizePath(base);
        String normalPath = normalizePath(path);

        if ("/".equals(normalBase)) return normalPath;
        if ("/".equals(normalPath)) return normalBase;

        return normalBase + normalPath;
    }
}
