package com.brasilpanel.backend.dto.api.metalsDev;

public record MetalsResponseDTO(
        String status,
        String currency,
        String unit,
        MetalsDataDTO metals,
        TimeStampsDTO timestamps
) {}
