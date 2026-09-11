package com.brasilpanel.backend.config.ratelimit;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Descobre o IP do cliente a partir da requisição.
 *
 * <p>Vive aqui, e não dentro de um filtro, porque duas defesas diferentes precisam
 * da mesma resposta: o teto de requisições ({@link RateLimitFilter}) e o bloqueio de
 * tentativas de login. Duas cópias desta lógica divergiriam, e divergir na análise
 * de um header hostil é como se abre um buraco sem ninguém notar.
 *
 * <p><b>Por que o primeiro IP e não o último.</b> Pegar o último elemento da cadeia é
 * a receita usual contra forjamento, e vale quando existe exatamente um proxy
 * confiável na frente. Não é o caso aqui: o frontend na Vercel reescreve
 * {@code /api/*} para o Render (ver DEPLOY.md, seção 1), então a requisição chega
 * como {@code cliente, edge-do-frontend} e o último elemento é o edge, comum a todos.
 *
 * <p><b>O que a validação resolve, e o que não resolve.</b> Sem ela qualquer string
 * no header vira uma chave nova, e o teto por IP deixa de existir para quem souber
 * disso. Exigir um literal de IP tira o caso trivial. Mas não transforma anônimo em
 * identidade confiável: sobram 2^32 endereços IPv4 para rotacionar. O teto por IP é
 * best-effort e ponto final.
 */
public final class ClientIp {

    /** 45 = maior literal IPv6 possível, na forma mista com IPv4 embutido. */
    private static final int MAX_LENGTH = 45;

    private ClientIp() {
    }

    /**
     * O IP do cliente: o primeiro de {@code X-Forwarded-For} quando for mesmo um IP,
     * caindo para o endereço da conexão.
     *
     * <p>Ler o header não é opcional: em produção a aplicação fica atrás do proxy do
     * Render, e {@code getRemoteAddr()} devolveria o IP do proxy para todo mundo.
     */
    public static String fromRequest(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            int virgula = forwarded.indexOf(',');
            String primeiro = (virgula > 0 ? forwarded.substring(0, virgula) : forwarded).trim();
            if (isLiteral(primeiro)) {
                return primeiro;
            }
        }
        return request.getRemoteAddr();
    }

    /**
     * Se o texto é um literal de endereço IP.
     *
     * <p>Escrito à mão porque o projeto não tem Guava nem commons-validator, e porque
     * {@code InetAddress.getByName} resolveria DNS para qualquer coisa que não fosse
     * literal — transformar um header hostil em consulta de rede seria trocar um
     * problema pequeno por um grande.
     *
     * <p>O IPv6 aqui é conservador, não um parser de RFC: aceita algum literal
     * malformado que um parser recusaria. Serve ao propósito, que é distinguir "isto
     * parece um endereço" de "isto é uma string arbitrária escolhida para criar uma
     * chave nova".
     */
    public static boolean isLiteral(String value) {
        if (value == null || value.isEmpty() || value.length() > MAX_LENGTH) {
            return false;
        }
        return value.indexOf(':') >= 0 ? isIpv6(value) : isIpv4(value);
    }

    private static boolean isIpv4(String value) {
        int octetos = 0;
        int inicio = 0;

        for (int i = 0; i <= value.length(); i++) {
            if (i != value.length() && value.charAt(i) != '.') {
                continue;
            }
            int digitos = i - inicio;
            if (digitos < 1 || digitos > 3) {
                return false;
            }
            int valor = 0;
            for (int j = inicio; j < i; j++) {
                char c = value.charAt(j);
                if (c < '0' || c > '9') {
                    return false;
                }
                valor = valor * 10 + (c - '0');
            }
            if (valor > 255) {
                return false;
            }
            octetos++;
            inicio = i + 1;
        }
        return octetos == 4;
    }

    private static boolean isIpv6(String value) {
        int doisPontos = 0;

        for (int i = 0; i < value.length(); i++) {
            char c = value.charAt(i);
            if (c == ':') {
                doisPontos++;
            } else if (c != '.' && Character.digit(c, 16) < 0) {
                // '.' é aceito por causa da forma mista (::ffff:192.0.2.1).
                return false;
            }
        }
        return doisPontos >= 2 && doisPontos <= 8;
    }
}
