package com.brasilpanel.backend.dto.api.metalsDev;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.Map;

/**
 * Resposta do endpoint Metals Dev /v1/timeseries.
 * "rates" é um mapa data → preços do dia. currency/unit são sempre USD/toz.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record MetalsTimeseriesResponseDTO(
        String status,
        String currency,
        String unit,
        Map<String, MetalsTimeseriesDayDTO> rates
) {}