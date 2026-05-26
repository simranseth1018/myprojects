package io.javaframework.web.routing;

import io.javaframework.web.http.HttpMethod;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;

@DisplayName("Router")
class RouterTest {

    private Router router;
    private Object dummyBean;
    private Method dummyMethod;

    @BeforeEach
    void setUp() throws NoSuchMethodException {
        router = new Router();
        dummyBean = new Object();
        dummyMethod = Object.class.getDeclaredMethod("toString");
    }

    @Test
    @DisplayName("resolves literal GET route")
    void resolvesLiteralGetRoute() {
        router.register(HttpMethod.GET, "/users", dummyBean, dummyMethod);

        Optional<RouteMatch> match = router.resolve(HttpMethod.GET, "/users");

        assertThat(match).isPresent();
        assertThat(match.get().pathVariables()).isEmpty();
    }

    @Test
    @DisplayName("returns empty for unregistered route")
    void returnsEmptyForUnregisteredRoute() {
        Optional<RouteMatch> match = router.resolve(HttpMethod.GET, "/nonexistent");

        assertThat(match).isEmpty();
    }

    @Test
    @DisplayName("extracts path variables from variable routes")
    void extractsPathVariables() {
        router.register(HttpMethod.GET, "/users/{id}", dummyBean, dummyMethod);

        Optional<RouteMatch> match = router.resolve(HttpMethod.GET, "/users/42");

        assertThat(match).isPresent();
        assertThat(match.get().pathVariables()).containsEntry("id", "42");
    }

    @Test
    @DisplayName("extracts multiple path variables")
    void extractsMultiplePathVariables() {
        router.register(HttpMethod.GET, "/users/{userId}/orders/{orderId}", dummyBean, dummyMethod);

        Optional<RouteMatch> match = router.resolve(HttpMethod.GET, "/users/10/orders/99");

        assertThat(match).isPresent();
        assertThat(match.get().pathVariables())
            .containsEntry("userId", "10")
            .containsEntry("orderId", "99");
    }

    @Test
    @DisplayName("literal routes take precedence over variable routes")
    void literalRoutesTakePrecedence() throws NoSuchMethodException {
        Method specificMethod = String.class.getDeclaredMethod("length");
        Method variableMethod = Object.class.getDeclaredMethod("toString");

        router.register(HttpMethod.GET, "/users/{id}", dummyBean, variableMethod);
        router.register(HttpMethod.GET, "/users/profile", dummyBean, specificMethod);

        // /users/profile should match the literal route, not the variable one
        Optional<RouteMatch> match = router.resolve(HttpMethod.GET, "/users/profile");

        assertThat(match).isPresent();
        assertThat(match.get().route().getHandlerMethod()).isEqualTo(specificMethod);
    }

    @Test
    @DisplayName("method-specific routing: GET and POST on same path are different routes")
    void methodSpecificRouting() throws NoSuchMethodException {
        Method getMethod = String.class.getDeclaredMethod("length");
        Method postMethod = String.class.getDeclaredMethod("hashCode");

        router.register(HttpMethod.GET, "/users", dummyBean, getMethod);
        router.register(HttpMethod.POST, "/users", dummyBean, postMethod);

        Optional<RouteMatch> getMatch = router.resolve(HttpMethod.GET, "/users");
        Optional<RouteMatch> postMatch = router.resolve(HttpMethod.POST, "/users");

        assertThat(getMatch.get().route().getHandlerMethod()).isEqualTo(getMethod);
        assertThat(postMatch.get().route().getHandlerMethod()).isEqualTo(postMethod);
    }

    @Test
    @DisplayName("pathExists returns true for registered paths regardless of method")
    void pathExistsIgnoresMethod() {
        router.register(HttpMethod.GET, "/users", dummyBean, dummyMethod);

        assertThat(router.pathExists("/users")).isTrue();
        assertThat(router.pathExists("/orders")).isFalse();
    }

    @Test
    @DisplayName("getAllowedMethods returns methods registered for a path")
    void getAllowedMethodsForPath() throws NoSuchMethodException {
        router.register(HttpMethod.GET, "/users", dummyBean, dummyMethod);
        router.register(HttpMethod.POST, "/users", dummyBean,
            Object.class.getDeclaredMethod("hashCode"));

        var allowed = router.getAllowedMethods("/users");

        assertThat(allowed).containsExactlyInAnyOrder(HttpMethod.GET, HttpMethod.POST);
    }
}
