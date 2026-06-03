package com.brasilpanel.backend.dto.api.ibge;

import java.math.BigDecimal;

/** PIB de uma UF num ano (reais absolutos). Fonte IBGE/SIDRA. */
public record PibEstadualDTO(
        Integer year,
        Integer ufCode,
        String uf,
        BigDecimal value
) {}