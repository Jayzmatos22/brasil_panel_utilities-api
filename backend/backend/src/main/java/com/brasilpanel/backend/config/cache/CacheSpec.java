package com.brasilpanel.backend.config.cache;

import java.time.Duration;

/**
 * Definição de um cache da aplicação.
 *
 * @param name        nome do cache — deve coincidir com o valor usado em {@code @Cacheable}
 * @param ttl         janela de expiração após escrita
 * @param maximumSize teto de entradas retidas — dimensionado pela cardinalidade da chave
 *                    (métodos sem parâmetro retêm 1 entrada)
 */
public record CacheSpec(String name, Duration ttl, long maximumSize) {

    public CacheSpec {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Nome do cache não pode ser vazio");
        }
        if (ttl == null || ttl.isZero() || ttl.isNegative()) {
            throw new IllegalArgumentException(
                    "TTL do cache '" + name + "' deve ser maior que zero (recebido: " + ttl + ")");
        }
        if (maximumSize <= 0) {
            throw new IllegalArgumentException(
                    "maximumSize do cache '" + name + "' deve ser maior que zero (recebido: " + maximumSize + ")");
        }
    }
}