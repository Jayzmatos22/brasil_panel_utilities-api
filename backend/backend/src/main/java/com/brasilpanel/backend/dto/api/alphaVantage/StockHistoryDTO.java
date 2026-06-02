package com.brasilpanel.backend.dto.api.alphaVantage;

import java.util.List;

/** Histórico de uma ação — série diária ordenada por data crescente. */
public record StockHistoryDTO(
        String symbol,
        List<StockHistoryPointDTO> data
) {}