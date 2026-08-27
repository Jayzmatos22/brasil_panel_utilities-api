package com.brasilpanel.backend.config.jwt;

import com.brasilpanel.backend.model.UserEntity;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.UUID;


@Service
public class JwtService {

    // ── Secret injetado via application.yaml → variável de ambiente JWT_SECRET ──
    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration-ms}")
    private long expirationMs;

    private static final String ISSUER = "brasil-panel";


    /** Validade do token, para o cliente saber quando a sessão expira sem lê-lo. */
    public long getExpirationMs() {
        return expirationMs;
    }


    // Chave de assinatura derivada do secret externo.
    // UTF-8 explícito: o charset padrão da JVM difere entre Windows (dev) e Linux (deploy),
    // o que geraria chaves distintas para o mesmo secret e invalidaria os tokens em produção.
    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }


    // Gerar token com issuer, jti e role para rastreabilidade e autorização no frontend
    public String generateToken(UserDetails userDetails) {
        var builder = Jwts.builder()
                .issuer(ISSUER)
                .subject(userDetails.getUsername())
                .id(UUID.randomUUID().toString())   // jti — ID único do token
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expirationMs));

        // Inclui o role como claim extra para o frontend ler sem chamada adicional
        if (userDetails instanceof UserEntity user) {
            builder.claim("role", user.getRole().name());
        }

        return builder.signWith(getSigningKey()).compact();
    }


    // Extrair email (subject)
    public String extractEmail(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .requireIssuer(ISSUER)              // valida o emissor
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }


    // Validar token — uma única leitura das claims.
    // Antes eram duas: extractEmail e isTokenExpired parseavam o token de novo, cada
    // uma reverificando a assinatura HMAC. Somado ao extractEmail que o JwtFilter já
    // faz, eram três verificações criptográficas por requisição.
    public boolean isTokenValid(String token, UserDetails userDetails) {
        Claims claims = Jwts.parser()
                .verifyWith(getSigningKey())
                .requireIssuer(ISSUER)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return claims.getSubject().equals(userDetails.getUsername())
                && claims.getExpiration().after(new Date())
                && emitidoAposUltimaTrocaDeSenha(claims, userDetails);
    }


    /**
     * Recusa tokens emitidos antes da última troca de senha.
     *
     * <p>É o que faz "trocar a senha" derrubar as sessões abertas. Sem isto o JWT
     * anterior seguia válido até expirar, e a troca de senha — a ação que a vítima
     * toma justamente para expulsar quem invadiu — não expulsava ninguém.
     *
     * <p><b>Comparação em segundos.</b> O {@code iat} do JWT tem precisão de
     * segundo (é o que a especificação define), enquanto o timestamp do banco tem
     * microssegundos. Sem truncar, o token emitido no MESMO segundo da troca
     * pareceria anterior a ela e seria recusado — o usuário trocaria a senha,
     * logaria em seguida e cairia para fora na requisição seguinte.
     *
     * <p>O preço do truncamento é uma janela de um segundo: um token emitido no
     * mesmo segundo da troca sobrevive. Para o atacante aproveitar, seria preciso
     * obter um token exatamente no segundo em que a vítima troca a senha.
     */
    private static boolean emitidoAposUltimaTrocaDeSenha(Claims claims, UserDetails userDetails) {
        if (!(userDetails instanceof UserEntity user) || user.getPasswordChangedAt() == null) {
            // Sem troca registrada não há nada a invalidar.
            return true;
        }

        Date issuedAt = claims.getIssuedAt();
        if (issuedAt == null) {
            // Token sem iat não é comprovadamente posterior à troca: recusa.
            return false;
        }

        LocalDateTime emitidoEm = LocalDateTime.ofInstant(issuedAt.toInstant(), ZoneId.systemDefault());
        LocalDateTime trocadaEm = user.getPasswordChangedAt().truncatedTo(ChronoUnit.SECONDS);

        return !emitidoEm.isBefore(trocadaEm);
    }
}