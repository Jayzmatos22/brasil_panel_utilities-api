package com.brasilpanel.backend.dto.api.metalsDev;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Preços de um dia dentro do /v1/timeseries.
 * "metals" é um mapa nome → preço — assim suportamos tanto os 4 preciosos
 * quanto os industriais, caso a API os inclua no plano free.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record MetalsTimeseriesDayDTO(
        Map<String, BigDecimal> metals,
        String date
) {}