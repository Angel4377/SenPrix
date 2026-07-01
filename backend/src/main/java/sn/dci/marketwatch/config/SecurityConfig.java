package sn.dci.marketwatch.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.*;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.web.cors.*;
import sn.dci.marketwatch.security.JwtAuthFilter;
import sn.dci.marketwatch.security.UserDetailsServiceImpl;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final UserDetailsServiceImpl userDetailsService;

    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter,
                          UserDetailsServiceImpl userDetailsService) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.userDetailsService = userDetailsService;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // ── CORS ──────────────────────────────────────────────────────────
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // ── CSRF desactive (API stateless JWT) ────────────────────────────
            .csrf(csrf -> csrf.disable())

            // ── Session stateless ─────────────────────────────────────────────
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // ── Headers de securite ───────────────────────────────────────────
            .headers(headers -> headers
                // SAMEORIGIN : permet Swagger UI (qui utilise des iframes internes)
                .frameOptions(fo -> fo.sameOrigin())
                // Le navigateur ne doit pas deviner le type MIME
                .contentTypeOptions(cto -> {})
                // Politique de referrer : n'envoyer que l'origine
                .referrerPolicy(rp -> rp.policy(
                    ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
                // CSP assoupli pour Swagger UI (unsafe-inline + unsafe-eval requis)
                .contentSecurityPolicy(csp -> csp.policyDirectives(
                    "default-src 'self'; " +
                    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
                    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
                    "font-src 'self' https://fonts.gstatic.com; " +
                    "img-src 'self' data: https://*.tile.openstreetmap.org; " +
                    "connect-src 'self'"))
                // HTTP Strict Transport Security (HTTPS obligatoire, 1 an)
                .httpStrictTransportSecurity(hsts -> hsts
                    .maxAgeInSeconds(31536000)
                    .includeSubDomains(true))
            )

            // ── Autorisations ─────────────────────────────────────────────────
            .authorizeHttpRequests(auth -> auth
                // (Swagger géré par WebSecurityCustomizer — voir ci-dessous)
                // Public
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/prices/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/regions").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/products").permitAll()
                // Admin uniquement
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                // Agent uniquement
                .requestMatchers("/api/agent/**").hasRole("AGENT")
                // Commercant uniquement
                .requestMatchers("/api/merchant/**").hasRole("MERCHANT")
                // Tout utilisateur authentifie
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        // Origines explicitement autorisees (pas de *)
        List<String> origins = List.of(allowedOrigins.split(","));
        config.setAllowedOrigins(origins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        // Headers autorises (Authorization, Content-Type, ...)
        config.setAllowedHeaders(List.of(
            "Authorization", "Content-Type", "Accept",
            "X-Requested-With", "Cache-Control"
        ));
        config.setExposedHeaders(List.of("Authorization"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L); // preflight cache 1h

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    /**
     * Exclut complètement Swagger du filtre Spring Security.
     * Plus fiable que permitAll() qui reste dans la chaîne de filtres.
     */
    @Bean
    public WebSecurityCustomizer webSecurityCustomizer() {
        return web -> web.ignoring().requestMatchers(
            "/swagger-ui/**",
            "/swagger-ui.html",
            "/v3/api-docs/**",
            "/v3/api-docs.yaml",
            "/webjars/**"
        );
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12); // strength 12 (memoire ingenieur)
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }
}
