package com.brasilpanel.backend.dto.api.alphaVantage;

import com.fasterxml.jackson.annotation.JsonProperty;

// Map entregue pelo AlphaVantage
public record GlobalQuoteWrapper(
        @JsonProperty("Global Quote") StockQuoteDTO globalQuote
) {}
