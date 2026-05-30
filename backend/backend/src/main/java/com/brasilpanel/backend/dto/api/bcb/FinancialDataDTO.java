package com.brasilpanel.backend.dto.api.bcb;

public record FinancialDataDTO(
        // Implements all types bcb
        SelicDataDTO selic,
        IpcaDataDTO ipca,
        DollarPtaxDTO dollarPtax,
        CdiDataDTO cdi
) {}
