package com.brasilpanel.backend.dto.api.metalsDev;

/**
 * Um dia da série histórica de metais (todos os metais do dia).
 * Campos podem ser null quando a API não fornece aquele metal.
 */
public record MetalHistoryPointDTO(
        String date,
        Double gold,
        Double silver,
        Double platinum,
        Double palladium,
        Double copper,
        Double aluminum,
        Double nickel,
        Double zinc
) {}