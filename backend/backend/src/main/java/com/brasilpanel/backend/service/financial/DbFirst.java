package com.brasilpanel.backend.service.financial;

import lombok.extern.slf4j.Slf4j;

import java.time.LocalDate;
import java.util.Optional;
import java.util.function.Supplier;

/**
 * Caminho único de leitura DB-first: serve o banco enquanto ele valer, busca na fonte
 * quando vencer e, se a busca falhar, devolve o que havia em vez de derrubar a resposta.
 *
 * <p>Recebe o veredito de frescor pronto, em vez de calculá-lo, porque "está velho?"
 * não tem uma resposta só. Séries datadas (IPEA, BCB) comparam a data de referência
 * com o calendário, via {@link SeriesFreshness}; cotações contínuas (AlphaVantage,
 * cripto, metais) comparam o instante da última busca com uma janela de duração, para
 * poupar cota da fonte. Misturar os dois quebra os dois lados: janela em série datada
 * faz a série vencer no fim de semana, quando não há o que buscar, e calendário em
 * cotação não significa nada, porque cotação não tem "último valor publicado".
 *
 * <p>O que os dois casos têm igual é o desfecho, e é só isso que mora aqui.
 */
@Slf4j
public final class DbFirst {

    private DbFirst() {
    }

    /**
     * @param rotulo     nome legível da série, usado só em log
     * @param doBanco    valor já montado a partir do banco, vazio se não há nada salvo
     * @param vencido    se o dado local já deveria ter sido substituído
     * @param referencia data do dado local, para o log situar o operador; pode ser nula
     * @param buscar     busca na fonte externa; pode lançar
     */
    public static <T> T serve(String rotulo, Optional<T> doBanco, boolean vencido,
                              LocalDate referencia, Supplier<T> buscar) {
        if (doBanco.isPresent() && !vencido) {
            return doBanco.get();
        }
        if (doBanco.isPresent()) {
            log.info("{} desatualizado no banco (última: {}). Buscando na fonte...", rotulo, referencia);
        }
        try {
            return buscar.get();
        } catch (RuntimeException e) {
            // Sem nada local não há o que degradar: mascarar isso entregaria resposta
            // vazia como se fosse legítima, que é pior que a falha aparecer.
            if (doBanco.isEmpty()) {
                throw e;
            }
            log.warn("Fonte indisponível para {} ({}). Servindo dados do banco (última: {}).",
                    rotulo, e.getMessage(), referencia);
            return doBanco.get();
        }
    }
}