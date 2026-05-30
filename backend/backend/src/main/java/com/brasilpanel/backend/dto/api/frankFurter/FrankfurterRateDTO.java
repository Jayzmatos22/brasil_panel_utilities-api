package com.brasilpanel.backend.dto.api.frankFurter;

import java.util.Map;

// Taxa atual
public record FrankfurterRateDTO(
        Double amount,
        String base,
        String date,
        Map<String, Double> rates
) {}
