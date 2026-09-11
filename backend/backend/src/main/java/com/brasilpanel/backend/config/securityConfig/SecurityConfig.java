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
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;

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
                // CSRF desligado com justificativa, não por conveniência: a sessão é um
                // cookie SameSite=Lax, o CORS só admite origens explícitas, a cadeia é
                // STATELESS e não existe GET que mude estado. Com isso um site terceiro
                // não consegue disparar POST/PATCH/DELETE autenticado — o navegador não
                // envia o cookie em requisição cross-site desses métodos. Se algum dia
                // entrar um GET mutante ou o SameSite mudar, este raciocínio cai junto.
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configure(http))
                // Do que está aqui, só Referrer-Policy e Permissions-Policy são novidade:
                // X-Content-Type-Options, X-Frame-Options e o próprio HSTS já vinham dos
                // defaults do Spring Security. O HSTS está declarado mesmo assim para
                // fixar o valor — um `defaultsDisabled()` futuro o derrubaria em silêncio.
                //
                // E declarar HSTS não basta: o writer só escreve quando
                // request.isSecure(), e atrás do Render o TLS termina no proxy. É o
                // forward-headers-strategy do application-prod.yml que faz o header
                // existir de verdade em produção — ver ProdConfigTest.
                .headers(headers -> headers
                        .httpStrictTransportSecurity(hsts -> hsts
                                .includeSubDomains(true)
                                .maxAgeInSeconds(31_536_000))
                        .referrerPolicy(referrer -> referrer
                                .policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
                        // API JSON: nenhum destes recursos faz sentido aqui. Negar tudo
                        // fecha a porta caso uma resposta seja renderizada num iframe.
                        .permissionsPolicyHeader(policy -> policy
                                .policy("camera=(), microphone=(), geolocation=(), payment=()")))
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

        // Antes do JwtFilter: recusar excesso é mais barato que validar token, e o
        // teto vale para tráfego anônimo, que é a maior parte.
        rateLimitFilter.ifAvailable(filter -> http.addFilterBefore(filter, JwtFilter.class));

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
