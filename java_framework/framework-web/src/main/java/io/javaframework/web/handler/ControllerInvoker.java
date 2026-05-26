package io.javaframework.web.handler;

import io.javaframework.json.JsonSerializer;
import io.javaframework.web.annotation.PathVariable;
import io.javaframework.web.annotation.RequestBody;
import io.javaframework.web.annotation.RequestParam;
import io.javaframework.web.http.HttpRequest;
import io.javaframework.web.http.HttpResponse;
import io.javaframework.web.http.HttpStatus;
import io.javaframework.web.routing.RouteMatch;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.lang.reflect.Method;
import java.lang.reflect.Parameter;

/**
 * Invokes a controller method via reflection, resolving all method parameters.
 *
 * <h2>What this does:</h2>
 * Given a matched route and an HTTP request, this class:
 * <ol>
 *   <li>Inspects the controller method's parameters using reflection</li>
 *   <li>For each parameter, determines HOW to resolve it:
 *     <ul>
 *       <li>@PathVariable → extract from URL path ({id} → "42")</li>
 *       <li>@RequestParam → extract from query string (?name=John)</li>
 *       <li>@RequestBody → deserialize JSON body</li>
 *       <li>HttpRequest → pass the request object itself</li>
 *       <li>HttpResponse → pass the response object (for manual response writing)</li>
 *     </ul>
 *   </li>
 *   <li>Calls method.invoke(controllerBean, resolvedArgs)</li>
 *   <li>Serializes the return value to JSON</li>
 *   <li>Wraps it in an HttpResponse</li>
 * </ol>
 *
 * <h2>Spring comparison:</h2>
 * Spring's equivalent: {@code HandlerMethodArgumentResolver} hierarchy.
 * Each resolver handles one argument type:
 * - {@code PathVariableMethodArgumentResolver} → @PathVariable
 * - {@code RequestParamMethodArgumentResolver} → @RequestParam
 * - {@code RequestResponseBodyMethodProcessor} → @RequestBody
 * - {@code HttpEntityMethodProcessor} → HttpEntity/ResponseEntity
 * - {@code PrincipalMethodArgumentResolver} → Principal (auth)
 *
 * Spring's {@code InvocableHandlerMethod} iterates the resolvers for each param.
 *
 * <h2>Type conversion:</h2>
 * A path variable extracted from the URL is always a String.
 * If the controller method has {@code @PathVariable Long id}, we must convert
 * "42" → 42L. We handle String-to-primitive conversions manually here.
 * Spring uses {@code ConversionService} for this.
 *
 * <h2>Interview Questions:</h2>
 * <ul>
 *   <li>How does Spring MVC resolve method arguments automatically?</li>
 *   <li>What is a HandlerMethodArgumentResolver?</li>
 *   <li>How does @RequestBody deserialization work in Spring?</li>
 *   <li>What happens if a @PathVariable type doesn't match? (Type mismatch exception)</li>
 *   <li>How would you add support for a custom annotation like @CurrentUser?</li>
 * </ul>
 *
 * @see io.javaframework.web.routing.Router
 * @see io.javaframework.web.middleware.MiddlewareChain
 */
public class ControllerInvoker {

    private static final Logger log = LoggerFactory.getLogger(ControllerInvoker.class);

    private final JsonSerializer jsonSerializer;

    public ControllerInvoker(JsonSerializer jsonSerializer) {
        this.jsonSerializer = jsonSerializer;
    }

    /**
     * Invokes the controller method for the given route match and request.
     *
     * @param match   the matched route (contains controller bean + method)
     * @param request the incoming HTTP request
     * @return the HTTP response
     */
    public HttpResponse invoke(RouteMatch match, HttpRequest request) {
        // Set path variables on the request so @PathVariable can access them
        request.setPathVariables(match.pathVariables());

        Method method = match.route().getHandlerMethod();
        Object controllerBean = match.route().getControllerBean();

        log.debug("Invoking: {}.{}()", controllerBean.getClass().getSimpleName(), method.getName());

        try {
            // Resolve all method arguments
            Object[] args = resolveArguments(method, request);

            // Invoke the controller method via reflection
            Object returnValue = method.invoke(controllerBean, args);

            // Build the HTTP response from the return value
            return buildResponse(returnValue, method);

        } catch (java.lang.reflect.InvocationTargetException e) {
            // The controller method threw an exception — unwrap and rethrow
            // The RequestHandler will catch this and return 500
            Throwable cause = e.getCause();
            if (cause instanceof RuntimeException rte) {
                throw rte;
            }
            throw new RuntimeException("Controller method threw exception", cause);
        } catch (IllegalAccessException e) {
            throw new RuntimeException("Cannot access controller method: " + method.getName(), e);
        }
    }

    // ─── Argument resolution ──────────────────────────────────────────────────

    /**
     * Resolves all arguments for the controller method from the HTTP request.
     *
     * <p>This iterates over each {@code Parameter} of the method and determines
     * how to populate its value. The order of resolution checks matches Spring's
     * priority.
     */
    private Object[] resolveArguments(Method method, HttpRequest request) {
        Parameter[] params = method.getParameters();
        Object[] args = new Object[params.length];

        for (int i = 0; i < params.length; i++) {
            args[i] = resolveArgument(params[i], request);
        }

        return args;
    }

    /**
     * Resolves a single method parameter.
     *
     * <h3>Resolution priority:</h3>
     * 1. @PathVariable → from URL path
     * 2. @RequestParam → from query string
     * 3. @RequestBody → from request body (JSON)
     * 4. HttpRequest → inject the request itself
     * 5. HttpResponse → inject a new response object (for manual response)
     * 6. Otherwise → null (or throw if no suitable resolver)
     */
    private Object resolveArgument(Parameter param, HttpRequest request) {
        Class<?> paramType = param.getType();

        // ── @PathVariable ──────────────────────────────────────────────────────
        if (param.isAnnotationPresent(PathVariable.class)) {
            return resolvePathVariable(param, request);
        }

        // ── @RequestParam ──────────────────────────────────────────────────────
        if (param.isAnnotationPresent(RequestParam.class)) {
            return resolveRequestParam(param, request);
        }

        // ── @RequestBody ───────────────────────────────────────────────────────
        if (param.isAnnotationPresent(RequestBody.class)) {
            return resolveRequestBody(param, request);
        }

        // ── HttpRequest injection ──────────────────────────────────────────────
        if (paramType.isAssignableFrom(HttpRequest.class)) {
            return request;
        }

        // Unknown parameter — attempt null (or consider throwing)
        log.warn("Cannot resolve parameter '{}' of type '{}' in controller method. " +
                 "Consider annotating it with @PathVariable, @RequestParam, or @RequestBody.",
                 param.getName(), paramType.getSimpleName());
        return null;
    }

    /**
     * Resolves a @PathVariable parameter.
     *
     * <h3>Name resolution:</h3>
     * 1. If @PathVariable("name") has a value → use that name
     * 2. Else use the parameter's own name (requires -parameters compiler flag)
     *
     * <h3>Type conversion:</h3>
     * Path variables are Strings; the parameter type may be Long, Integer, etc.
     * We convert using simple type checking.
     */
    private Object resolvePathVariable(Parameter param, HttpRequest request) {
        PathVariable annotation = param.getAnnotation(PathVariable.class);

        // Determine the variable name to look up
        String varName = annotation.value().isBlank()
            ? param.getName()       // requires -parameters flag
            : annotation.value();

        String rawValue = request.getPathVariable(varName)
            .orElseThrow(() -> new IllegalArgumentException(
                "Path variable '%s' not found in path '%s'"
                    .formatted(varName, request.getPath())));

        return convertToType(rawValue, param.getType());
    }

    /**
     * Resolves a @RequestParam from the query string.
     */
    private Object resolveRequestParam(Parameter param, HttpRequest request) {
        RequestParam annotation = param.getAnnotation(RequestParam.class);

        String paramName = annotation.value().isBlank()
            ? param.getName()
            : annotation.value();

        String rawValue = request.getQueryParam(paramName)
            .orElseGet(() -> {
                // Check default value
                if (!annotation.defaultValue().isBlank()) {
                    return annotation.defaultValue();
                }
                // Check if required
                if (annotation.required()) {
                    throw new IllegalArgumentException(
                        "Required query parameter '%s' is missing".formatted(paramName));
                }
                return null;
            });

        if (rawValue == null) return null;
        return convertToType(rawValue, param.getType());
    }

    /**
     * Resolves a @RequestBody by deserializing the JSON body.
     */
    private Object resolveRequestBody(Parameter param, HttpRequest request) {
        RequestBody annotation = param.getAnnotation(RequestBody.class);

        if (!request.hasBody()) {
            if (annotation.required()) {
                throw new IllegalArgumentException("Request body is required but missing");
            }
            return null;
        }

        try {
            return jsonSerializer.deserialize(request.getBody(), param.getType());
        } catch (Exception e) {
            throw new IllegalArgumentException(
                "Failed to deserialize request body to " + param.getType().getSimpleName(), e);
        }
    }

    // ─── Response building ────────────────────────────────────────────────────

    /**
     * Builds an HTTP response from the controller method's return value.
     *
     * <h3>Return value handling:</h3>
     * <ul>
     *   <li>{@code null} → 204 No Content</li>
     *   <li>{@code void} → 200 OK, no body</li>
     *   <li>{@code HttpResponse} → use it directly (manual response)</li>
     *   <li>{@code String} → 200 OK, text/plain body</li>
     *   <li>Any other object → serialize to JSON, 200 OK</li>
     * </ul>
     *
     * <h3>Spring comparison:</h3>
     * Spring's {@code HandlerMethodReturnValueHandler} hierarchy handles this.
     * {@code HttpEntityMethodProcessor} handles ResponseEntity<T>.
     * {@code RequestResponseBodyMethodProcessor} handles @ResponseBody return values.
     */
    private HttpResponse buildResponse(Object returnValue, Method method) {
        // void method
        if (method.getReturnType() == void.class) {
            return HttpResponse.ok();
        }

        // Null return
        if (returnValue == null) {
            return HttpResponse.noContent();
        }

        // Manual HttpResponse
        if (returnValue instanceof HttpResponse httpResponse) {
            return httpResponse;
        }

        // String → plain text
        if (returnValue instanceof String str) {
            return HttpResponse.ok().text(str);
        }

        // Everything else → JSON serialize
        try {
            String json = jsonSerializer.serialize(returnValue);
            return HttpResponse.ok().json(json);
        } catch (Exception e) {
            log.error("Failed to serialize response to JSON", e);
            return HttpResponse.serverError().json(
                """
                {"error": "Response serialization failed", "message": "%s"}
                """.formatted(e.getMessage())
            );
        }
    }

    // ─── Type conversion ──────────────────────────────────────────────────────

    /**
     * Converts a String value to the target type.
     *
     * <p>In production frameworks, this uses a {@code ConversionService} with
     * registered converters. We implement the common cases directly.
     *
     * <p>To support custom types, Phase 3 will add a {@code TypeConverter} registry.
     */
    private Object convertToType(String value, Class<?> targetType) {
        if (targetType == String.class) return value;

        try {
            // Numeric types
            if (targetType == Long.class || targetType == long.class) {
                return Long.parseLong(value);
            }
            if (targetType == Integer.class || targetType == int.class) {
                return Integer.parseInt(value);
            }
            if (targetType == Double.class || targetType == double.class) {
                return Double.parseDouble(value);
            }
            if (targetType == Float.class || targetType == float.class) {
                return Float.parseFloat(value);
            }
            if (targetType == Boolean.class || targetType == boolean.class) {
                return Boolean.parseBoolean(value);
            }

            // UUID
            if (targetType == java.util.UUID.class) {
                return java.util.UUID.fromString(value);
            }

            // Enum types
            if (targetType.isEnum()) {
                return Enum.valueOf((Class<Enum>) targetType, value.toUpperCase());
            }

        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(
                "Cannot convert '%s' to %s".formatted(value, targetType.getSimpleName()), e);
        }

        throw new IllegalArgumentException(
            "No type converter registered for: " + targetType.getName());
    }
}
