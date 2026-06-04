package com.brasilpanel.backend.config.jwt;

import com.brasilpanel.backend.model.UserEntity;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
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


    // Chave de assinatura derivada do secret externo
    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
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


    // Validar token
    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String email = extractEmail(token);
        return email.equals(userDetails.getUsername()) && !isTokenExpired(token);
    }


    // Verificar expiração
    private boolean isTokenExpired(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .requireIssuer(ISSUER)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getExpiration()
                .before(new Date());
    }
}