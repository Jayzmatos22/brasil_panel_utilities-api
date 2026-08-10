package com.brasilpanel.backend.dto.api.viaCep;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Espelho 1:1 da resposta do ViaCEP — inclusive o campo {@code erro}, que só
 * existe quando o CEP não é encontrado.
 *
 * <p>Este record não sai da camada de serviço: o contrato exposto pela API do
 * painel é o {@link EnderecoCepDTO}. Manter os dois separados é o que permite
 * tratar {@code erro} como 404 em vez de devolver um objeto com todos os campos
 * nulos.
 *
 * <p>{@code erro} é {@code String} de propósito: o ViaCEP já respondeu
 * {@code "erro": true} (booleano) e hoje responde {@code "erro": "true"}
 * (string). O Jackson coage booleano para String, então o campo aceita as duas
 * formas — o que importa é comparar com {@code null}, não o conteúdo.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record ViaCepRawDTO(
        String cep,
        String logradouro,
        String complemento,
        String unidade,
        String bairro,
        String localidade,
        String uf,
        String estado,
        String regiao,
        String ibge,
        String gia,
        String ddd,
        String siafi,
        String erro
) {

    /** O ViaCEP responde 200 com {@code {"erro": ...}} para CEP inexistente. */
    public boolean notFound() {
        return erro != null;
    }
}