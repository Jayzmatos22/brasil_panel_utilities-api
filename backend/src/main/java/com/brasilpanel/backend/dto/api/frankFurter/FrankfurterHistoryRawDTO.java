package com.brasilpanel.backend.dto.api.frankFurter;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.Map;


// Histórico completo
public record FrankfurterHistoryRawDTO(
        Double amount,
        String base,
        @JsonProperty("start_date") String startDate,
        @JsonProperty("end_date") String endDate,
        Map<String, Map<String, Double>> rates
) {}
