package com.brasilpanel.backend.dto.api.metalsDev;

import java.time.Instant;

public record MetalsDataDTO(
        Double gold,
        Double silver,
        Double platinum,
        Double palladium,
        Double copper,
        Double aluminum,
        Double nickel,
        Double zinc,
        Instant lastUpdated
) {}
