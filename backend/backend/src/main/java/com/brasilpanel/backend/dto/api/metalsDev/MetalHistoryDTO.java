package com.brasilpanel.backend.dto.api.metalsDev;

import java.util.List;

/**
 * Série histórica de metais entregue ao frontend.
 * currency/unit refletem a origem (USD/toz no timeseries) — o card de cotação
 * atual usa BRL, então o gráfico deve rotular a unidade explicitamente.
 */
public record MetalHistoryDTO(
        String currency,
        String unit,
        List<MetalHistoryPointDTO> data
) {}