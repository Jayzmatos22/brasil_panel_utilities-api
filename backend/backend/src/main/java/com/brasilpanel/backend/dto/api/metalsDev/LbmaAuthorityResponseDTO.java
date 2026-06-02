package com.brasilpanel.backend.dto.api.metalsDev;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;

/**
 * Resposta do endpoint Metals Dev /v1/metal/authority?authority=lbma.
 * "rates" traz chaves como lbma_gold_am / lbma_gold_pm / lbma_silver — mapeadas
 * como Map para robustez caso a API adicione/omita campos.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record LbmaAuthorityResponseDTO(
        String status,
        String authority,
        String currency,
        String unit,
        Instant timestamp,
        Map<String, BigDecimal> rates
) {}