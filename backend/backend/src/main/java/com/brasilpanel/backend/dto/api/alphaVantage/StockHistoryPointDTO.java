package com.brasilpanel.backend.dto.api.alphaVantage;

/** Um pregão da série histórica de uma ação (TIME_SERIES_DAILY). */
public record StockHistoryPointDTO(
        String date,
        double open,
        double high,
        double low,
        double close,
        Long volume
) {}