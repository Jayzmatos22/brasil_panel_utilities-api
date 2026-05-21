package com.brasilpanel.backend.dto.api.bcb;

public record IpcaDataDTO(
        // Será retornado a partir de IpcaHistoryDTO
        double currentMonth,
        double accumulatedYear,
        double last12MonthsSum,
        double last12MonthsCompound
) {}
