package com.brasilpanel.backend.config.securityConfig;

import com.brasilpanel.backend.config.jwt.JwtFilter;
import com.brasilpanel.backend.config.ratelimit.RateLimitFilter;
import org.springframework.beans.factory.ObjectProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity          // habilita @PreAuthorize / @PostAuthorize nos controllers
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtFilter jwtFilter;
    private final UserDetailsService userDetailsService;
    private final Environment env;

    /**
     * ObjectProvider porque o filtro é condicional: com app.rate-limit.enabled=false
     * o bean não existe (é o caso dos testes, onde o teto atrapalharia). Exigi-lo por
     * construtor quebraria todo slice @WebMvcTest.
     */
    private final ObjectProvider<RateLimitFilter> rateLimitFilter;


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
                    // Health check — precisa ser público para o orquestrador
                    // (Render) conseguir verificar se a aplicação subiu.
                    auth.requestMatchers("/actuator/health").permitAll();

                    // Rotas admin — somente ROLE_ADMIN
                    auth.requestMatchers("/api/admin/**").hasRole("ADMIN");

                    // Rotas públicas de dados e autenticação (inclui verify-email e resend-code)
                    auth.requestMatchers(
                            "/api/auth/register",
                            "/api/auth/login",
                            // Sem sessão ainda: é justamente esta rota que a emite.
                            "/api/auth/admin/confirm-login",
                            "/api/auth/verify-email",
                            "/api/auth/resend-code",
                            // Quem esqueceu a senha não tem como estar autenticado.
                            "/api/auth/forgot-password",
                            "/api/auth/reset-password",
                            // Público de propósito: uma sessão já expirada precisa
                            // conseguir limpar o próprio cookie.
                            "/api/auth/logout",
                            //
                            "/api/banks/**",
                            "/api/coingecko/**",
                            "/api/coinmarketcap/**",
                            // Precisa casar com o @RequestMapping do ViaCepController.
                            // Estava "/api/cep/**", prefixo que nenhum controller
                            // atende: a regra era morta e /api/viacep caía em
                            // anyRequest().authenticated().
                            "/api/viacep/**",
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
                // Sem entry point explícito o Spring Security cai no
                // Http403ForbiddenEntryPoint, e requisição anônima em rota protegida
                // virava 403. O interceptor do frontend só redireciona para o login
                // em 401 (Client.ts), então a sessão expirada travava numa mensagem
                // de erro genérica em vez de mandar o usuário relogar.
                .exceptionHandling(handling ->
                        handling.authenticationEntryPoint(unauthorizedEntryPoint())
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        // DEPOIS do JwtFilter, não antes. A ordem inversa era mais barata — recusar
        // excesso sem validar token —, mas deixava o RateLimitFilter sem nenhuma
        // identidade confiável: ele só via o X-Forwarded-For, que o cliente controla,
        // e bastava variar o header para ganhar um balde novo a cada requisição.
        //
        // Rodando depois, o SecurityContext já está populado e o teto de quem está
        // logado passa a ser chaveado pelo sub do JWT, que é assinado. O custo é uma
        // verificação HMAC antes de recusar — microssegundos, e só para quem mandou
        // token; requisição anônima sai do JwtFilter no primeiro `if`.
        rateLimitFilter.ifAvailable(filter -> http.addFilterAfter(filter, JwtFilter.class));

        return http.build();
    }


    /**
     * 401 para quem não está autenticado. O 403 continua valendo para quem ESTÁ
     * autenticado mas não tem o papel exigido (ex: USER em /api/admin/**) — essa
     * distinção é do AccessDeniedHandler, que segue no padrão.
     */
    @Bean
    public AuthenticationEntryPoint unauthorizedEntryPoint() {
        return new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED);
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
