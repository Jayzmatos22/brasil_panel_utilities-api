package com.brasilpanel.backend.service.api.bcb;

import com.brasilpanel.backend.dto.api.bcb.*;

import java.util.List;

public interface BcbImplementations {

    SelicDataDTO getSelic();
    IpcaDataDTO getIpca();
    DollarPtaxDTO getDollarPtax();
    CdiDataDTO getCdiRate();
    List<SelicHistoryDTO> getSelicHistory();
    FinancialDataDTO getFinancialData();
    List<MinimumWageDTO> getMinimumWage(int intervaloMeses);
    List<MinimumWageDTO> getMinimumWageAll();
}
