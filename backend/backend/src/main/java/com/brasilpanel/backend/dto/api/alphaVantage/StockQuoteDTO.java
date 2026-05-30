package com.brasilpanel.backend.dto.api.alphaVantage;

import com.fasterxml.jackson.annotation.JsonProperty;

public record StockQuoteDTO(
        @JsonProperty("01. symbol") String symbol,
        @JsonProperty("02. open") Double open,
        @JsonProperty("03. high") Double high,
        @JsonProperty("04. low") Double low,
        @JsonProperty("05. price") Double price,
        @JsonProperty("06. volume") Long volume,
        @JsonProperty("07. latest trading day") String latestTradingDay,
        @JsonProperty("08. previous close") Double previousClose,
        @JsonProperty("09. change") Double change,
        @JsonProperty("10. change percent") String changePercent
) {}
