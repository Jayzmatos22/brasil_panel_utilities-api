package com.brasilpanel.backend.service.email;

/**
 * Publicado quando uma intenção de envio entra na fila.
 *
 * <p>Serve para o drain acontecer <b>na hora</b>, em vez de esperar a próxima
 * varredura. É o que permite a varredura ser rara sem atrasar o código de
 * verificação que o usuário está esperando na tela.
 *
 * <p>Não carrega o id da entrada de propósito: quem trata o evento drena o lote
 * pendente, não uma linha específica. Assim um evento perdido não perde o e-mail —
 * a varredura periódica pega na rodada seguinte.
 */
public record EmailEnqueuedEvent() {
}
