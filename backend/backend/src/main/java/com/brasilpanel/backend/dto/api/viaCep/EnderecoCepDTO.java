package com.brasilpanel.backend.dto.api.viaCep;

/**
 * Endereço servido pela API do painel — contrato estável, independente do
 * formato do ViaCEP.
 *
 * <p>Traz todos os campos que a API de origem devolve, e não apenas os do
 * cadastro de usuário que existia antes. O mais relevante é o
 * {@code municipioId}: é o código IBGE do município, ou seja, exatamente o
 * {@code IbgeCity#getId()} já persistido. Com ele o front navega de um CEP até
 * o município da página de Estados e Municípios sem nenhuma consulta extra.
 */
public record EnderecoCepDTO(
        String cep,
        String logradouro,
        String complemento,
        /** Unidade dos Correios — preenchido em CEP de caixa postal / grande usuário. */
        String unidade,
        String bairro,
        /** {@code localidade} no ViaCEP. */
        String municipio,
        /** Código IBGE do município — casa com {@code ibge_cities.id}. */
        Integer municipioId,
        String uf,
        String estado,
        /** Região — casa com {@code ibge_states.regiao_nome}. */
        String regiao,
        String ddd,
        /** Código SIAFI do município. */
        String siafi,
        /** Código GIA — só municípios de SP. */
        String gia
) {

    public static EnderecoCepDTO from(ViaCepRawDTO raw) {
        return new EnderecoCepDTO(
                raw.cep(),
                raw.logradouro(),
                raw.complemento(),
                raw.unidade(),
                raw.bairro(),
                raw.localidade(),
                parseMunicipioId(raw.ibge()),
                raw.uf(),
                raw.estado(),
                raw.regiao(),
                raw.ddd(),
                raw.siafi(),
                raw.gia()
        );
    }

    /**
     * O ViaCEP entrega o código IBGE como texto e, em CEPs sem município
     * associado, como string vazia. Converter aqui evita que cada consumidor
     * repita o parse — e devolver {@code null} é mais honesto que um 0, que
     * pareceria um município válido.
     */
    private static Integer parseMunicipioId(String ibge) {
        if (ibge == null || ibge.isBlank()) return null;
        try {
            return Integer.valueOf(ibge.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}