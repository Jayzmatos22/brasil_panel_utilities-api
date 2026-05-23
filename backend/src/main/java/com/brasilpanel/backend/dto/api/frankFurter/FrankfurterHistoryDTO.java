package com.brasilpanel.backend.dto.api.frankFurter;

import java.util.List;

public record FrankfurterHistoryDTO(
        String base,
        String target,
        List<FrankfurterHistoryItemDTO> data
) {}
