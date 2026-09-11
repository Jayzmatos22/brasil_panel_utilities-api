package com.brasilpanel.backend.service.auth;

import com.brasilpanel.backend.config.ratelimit.ClientIp;
import com.brasilpanel.backend.exception.customized.TooManyAttemptsException;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.Duration;
import java.util.Locale;

/**
 * Limita tentativas de login, para conter força bruta.
 *
 * <p><b>Por que duas contagens.</b> Antes havia só uma, por e-mail: 5 erros em 15
 * minutos e a conta ficava trancada. Isso conteve a força bruta e criou outro
 * problema — qualquer pessoa que soubesse o e-mail de alguém trancava a conta dessa
 * pessoa com 5 requisições, indefinidamente e de graça. A defesa virava a arma.
 *
 * <p>Agora o bloqueio apertado é por <b>par (e-mail, IP)</b>, que é o que descreve
 * "alguém tentando adivinhar esta senha daqui". O teto por e-mail continua existindo,
 * muito mais alto, como rede de segurança contra quem distribui as tentativas por
 * vários IPs.
 *
 * <p><b>O que isto não resolve.</b> Não elimina o travamento de conta alheia: quem
 * rotaciona IP ainda chega aos {@value #MAX_POR_EMAIL} e tranca. Encarece o ataque em
 * uma ordem de grandeza, não o impede. Fechar de vez exige uma defesa que não dependa
 * de bloquear — desafio ao usuário, por exemplo —, que é decisão de produto e não
 * cabia aqui.
 *
 * <p>Usa o Caffeine que já é dependência do projeto. A contagem vive na memória da
 * instância: com mais de uma réplica, cada uma mantém o próprio contador e o limite
 * efetivo é multiplicado pelo número de réplicas. Para instância única é suficiente;
 * se o projeto escalar, a contagem precisa migrar para um store compartilhado.
 *
 * <p>As entradas expiram sozinhas ao fim da janela, então não há limpeza a fazer.
 */
@Component
public class LoginAttemptLimiter {

    /** Erros tolerados para o mesmo e-mail vindo do mesmo IP. */
    static final int MAX_POR_IP = 5;

    /**
     * Erros tolerados para o mesmo e-mail somando todos os IPs.
     *
     * <p>Dez vezes o teto por IP. Alto o bastante para que travar a conta de alguém
     * exija rotacionar IP muitas vezes, e baixo o bastante para ainda barrar força
     * bruta distribuída contra uma única conta.
     */
    static final int MAX_POR_EMAIL = 50;

    private static final Duration JANELA = Duration.ofMinutes(15);
    private static final long MAX_CHAVES = 10_000;

    /** Usado quando não há requisição no contexto — ver {@link #ipAtual()}. */
    private static final String IP_DESCONHECIDO = "sem-requisicao";

    private final Cache<String, Integer> falhasPorEmailEIp = novoCache();
    private final Cache<String, Integer> falhasPorEmail = novoCache();

    private static Cache<String, Integer> novoCache() {
        return Caffeine.newBuilder()
                .expireAfterWrite(JANELA)
                .maximumSize(MAX_CHAVES)
                .build();
    }

    /** Rejeita a tentativa se qualquer um dos dois tetos já estourou na janela atual. */
    public void checkNotBlocked(String email) {
        if (atingiu(falhasPorEmailEIp, chaveEmailEIp(email), MAX_POR_IP)
                || atingiu(falhasPorEmail, normalize(email), MAX_POR_EMAIL)) {
            throw new TooManyAttemptsException(
                    "Muitas tentativas de login. Aguarde " + JANELA.toMinutes()
                            + " minutos e tente novamente.");
        }
    }

    public void recordFailure(String email) {
        falhasPorEmailEIp.asMap().merge(chaveEmailEIp(email), 1, Integer::sum);
        falhasPorEmail.asMap().merge(normalize(email), 1, Integer::sum);
    }

    /**
     * Zera os contadores após um login bem-sucedido.
     *
     * <p>Zera também o teto por e-mail: chegar aqui exigiu a senha correta, o que um
     * atacante não consegue forjar. Sem isso, erros legítimos anteriores iriam se
     * acumulando até trancar quem acabou de provar que é dono da conta.
     */
    public void reset(String email) {
        falhasPorEmailEIp.invalidate(chaveEmailEIp(email));
        falhasPorEmail.invalidate(normalize(email));
    }

    private static boolean atingiu(Cache<String, Integer> cache, String chave, int teto) {
        Integer falhas = cache.getIfPresent(chave);
        return falhas != null && falhas >= teto;
    }

    private static String chaveEmailEIp(String email) {
        return normalize(email) + '|' + ipAtual();
    }

    /**
     * O IP da requisição em curso.
     *
     * <p>Lido do contexto em vez de recebido por parâmetro para não empurrar
     * {@code HttpServletRequest} pela assinatura do {@code AuthService}, que é código
     * de domínio e não deveria conhecer a camada web.
     *
     * <p>Fora de uma requisição (agendador, teste sem contexto) devolve um valor fixo.
     * Todas essas chamadas compartilham um balde só, o que é correto: sem requisição
     * não há cliente a distinguir.
     */
    private static String ipAtual() {
        RequestAttributes atributos = RequestContextHolder.getRequestAttributes();
        if (atributos instanceof ServletRequestAttributes servlet) {
            HttpServletRequest request = servlet.getRequest();
            return ClientIp.fromRequest(request);
        }
        return IP_DESCONHECIDO;
    }

    // E-mail é case-insensitive: sem normalizar, bastaria variar a caixa para burlar o limite.
    private static String normalize(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }
}
