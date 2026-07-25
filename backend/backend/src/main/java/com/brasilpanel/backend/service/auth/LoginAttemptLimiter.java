package com.brasilpanel.backend.service.auth;

import com.brasilpanel.backend.exception.customized.TooManyAttemptsException;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Locale;

/**
 * Limita tentativas de login por e-mail, para conter ataques de força bruta.
 *
 * <p>Usa o Caffeine que já é dependência do projeto — sem biblioteca nova de rate
 * limiting. A contagem vive na memória da instância: com mais de uma réplica, cada
 * uma mantém o próprio contador, e o limite efetivo é multiplicado pelo número de
 * réplicas. Para o porte atual (instância única) isso é suficiente; se o projeto
 * escalar horizontalmente, a contagem precisa migrar para um store compartilhado.
 *
 * <p>As entradas expiram sozinhas ao fim da janela, então não há limpeza a fazer.
 */
@Component
public class LoginAttemptLimiter {

    private static final int MAX_ATTEMPTS = 5;
    private static final Duration WINDOW = Duration.ofMinutes(15);
    private static final long MAX_TRACKED_EMAILS = 10_000;

    private final Cache<String, Integer> failuresByEmail = Caffeine.newBuilder()
            .expireAfterWrite(WINDOW)
            .maximumSize(MAX_TRACKED_EMAILS)
            .build();

    /** Rejeita a tentativa se o e-mail já estourou o limite na janela atual. */
    public void checkNotBlocked(String email) {
        Integer failures = failuresByEmail.getIfPresent(normalize(email));
        if (failures != null && failures >= MAX_ATTEMPTS) {
            throw new TooManyAttemptsException(
                    "Muitas tentativas de login. Aguarde " + WINDOW.toMinutes() + " minutos e tente novamente.");
        }
    }

    public void recordFailure(String email) {
        failuresByEmail.asMap().merge(normalize(email), 1, Integer::sum);
    }

    /** Zera o contador após um login bem-sucedido. */
    public void reset(String email) {
        failuresByEmail.invalidate(normalize(email));
    }

    // E-mail é case-insensitive: sem normalizar, bastaria variar a caixa para burlar o limite.
    private static String normalize(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }
}