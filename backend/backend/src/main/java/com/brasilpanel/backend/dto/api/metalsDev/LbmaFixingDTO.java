package com.brasilpanel.backend.dto.api.metalsDev;

import java.time.Instant;

/**
 * Fixing oficial LBMA entregue ao frontend (USD/toz).
 * Campos podem ser null quando a API ainda não publicou aquele fixing (ex: PM pela manhã).
 */
public record LbmaFixingDTO(
        String currency,
        Instant timestamp,
        Double goldAm,
        Double goldPm,
        Double silver,
        Double platinumAm,
        Double platinumPm,
        Double palladiumAm,
        Double palladiumPm
) {}