package com.brasilpanel.backend.dto.api.bcb;

public record SelicDataDTO(
        // for getSelic()
        double currentRate,
        double accumulatedMonth,
        double accumulatedYear,
        double last12MonthsCompound
) {}
