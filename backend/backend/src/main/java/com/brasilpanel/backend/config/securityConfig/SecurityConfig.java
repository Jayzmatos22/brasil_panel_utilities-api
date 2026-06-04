package com.brasilpanel.backend.config.securityConfig;

import com.brasilpanel.backend.config.jwt.JwtFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtFilter jwtFilter;
    private final UserDetailsService userDetailsService;
    private final Environment env;


    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        boolean isDev = Arrays.asList(env.getActiveProfiles()).contains("dev");

        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configure(http))
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authorizeHttpRequests(auth -> {
                    // Rotas públicas de dados e autenticação
                    auth.requestMatchers(
                            "/api/auth/**",
                            "/api/banks/**",
                            "/api/coingecko/**",
                            "/api/cep/**",
                            "/api/bcb/**",
                            "/api/frankfurter",
                            "/api/frankfurter/**",
                            "/api/worldbank",
                            "/api/worldbank/**",
                            "/api/ibge",
                            "/api/ibge/**",
                            "/api/quote",
                            "/api/quote/**",
                            "/api/metals",
                            "/api/metals/**",
                            "/api/ipea",
                            "/api/ipea/**",
                            "/api/sidra",
                            "/api/sidra/**"
                    ).permitAll();

                    // Swagger e H2 Console acessíveis apenas no perfil dev
                    if (isDev) {
                        auth.requestMatchers(
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/v3/api-docs",
                                "/v3/api-docs/**",
                                "/v3/api-docs.yaml",
                                "/webjars/**",
                                "/h2-console/**"
                        ).permitAll();
                    }

                    auth.anyRequest().authenticated();
                })
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }


    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }


    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }


    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
