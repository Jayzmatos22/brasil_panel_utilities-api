package com.brasilpanel.backend.dto.api.metalsDev;

import java.time.Instant;
import java.time.LocalDateTime;

public record TimeStampsDTO(
        Instant metal,
        Instant currency
) {
}
