//package com.brasilpanel.backend.service;
//
//import com.brasilpanel.backend.dto.api.bcb.*;
//import com.brasilpanel.backend.service.api.bcb.BcbService;
//import org.junit.jupiter.api.Test;
//import org.junit.jupiter.api.extension.ExtendWith;
//import org.mockito.InjectMocks;
//import org.mockito.Mock;
//import org.mockito.junit.jupiter.MockitoExtension;
//import org.springframework.core.ParameterizedTypeReference;
//import org.springframework.web.client.RestClient;
//
//import java.util.List;
//import java.util.Map;
//
//import static org.junit.jupiter.api.Assertions.assertEquals;
//import static org.mockito.ArgumentMatchers.*;
//import static org.mockito.Mockito.verify;
//import static org.mockito.Mockito.when;
//
//@ExtendWith(MockitoExtension.class)
//public class BcbServiceTest {
//
//    @Mock
//    private RestClient restClient;
//
//    @Mock
//    private RestClient.RequestHeadersUriSpec requestHeadersUriSpec;
//
//    @Mock
//    private RestClient.ResponseSpec responseSpec;
//
//    @InjectMocks
//    private BcbService bcbService;
//
//    @Test
//    void returDollarPtax() {
//        List<DollarPtaxDTO> apiResponse = List.of(
//                new DollarPtaxDTO("19/05/2026", 5.87)
//        );
//
//        when(restClient.get()).thenReturn(requestHeadersUriSpec);
//        when(requestHeadersUriSpec.uri(anyString())).thenReturn(requestHeadersUriSpec);
//        when(requestHeadersUriSpec.retrieve()).thenReturn(responseSpec);
//        when(responseSpec.body(any(ParameterizedTypeReference.class))).thenReturn(apiResponse);
//
//        DollarPtaxDTO result = bcbService.getDollarPtax();
//
//        assertEquals("19/05/2026", result.date());
//        assertEquals(5.87, result.value());
//    }
//
//    @Test
//    void returnCdiRate(){
//        List<Map<String, String>> apiResponse = List.of(
//                Map.of("data", "19/05/2026", "valor", "0.87")
//        );
//        when(restClient.get()).thenReturn(requestHeadersUriSpec);
//        when(requestHeadersUriSpec.uri(anyString())).thenReturn(requestHeadersUriSpec);
//        when(requestHeadersUriSpec.retrieve()).thenReturn(responseSpec);
//        when(responseSpec.body(any(ParameterizedTypeReference.class))).thenReturn(apiResponse);
//
//        CdiDataDTO result = bcbService.getCdiRate();
//
//        assertEquals("19/05/2026", result.date());
//        assertEquals(0.87, result.value());
//
//
//    }
//
//    @Test
//    void returnIpcaDataComposed(){
//        // Service - dto direto
//        List<Map<String, String>> apiResponse = List.of(
//                Map.of("data", "01/05/2025", "valor", "0.43"),
//                Map.of("data", "01/06/2025", "valor", "0.24"),
//                Map.of("data", "01/07/2025", "valor", "0.38"),
//                Map.of("data", "01/08/2025", "valor", "0.44"),
//                Map.of("data", "01/09/2025", "valor", "0.44"),
//                Map.of("data", "01/10/2025", "valor", "0.56"),
//                Map.of("data", "01/11/2025", "valor", "0.39"),
//                Map.of("data", "01/12/2025", "valor", "0.52"),
//                Map.of("data", "01/01/2026", "valor", "0.16"),
//                Map.of("data", "01/02/2026", "valor", "1.31"),
//                Map.of("data", "01/03/2026", "valor", "0.88"),
//                Map.of("data", "01/04/2026", "valor", "0.67")
//        );
//
//        when(restClient.get()).thenReturn(requestHeadersUriSpec);
//        when(requestHeadersUriSpec.uri(anyString())).thenReturn(requestHeadersUriSpec);
//        when(requestHeadersUriSpec.retrieve()).thenReturn(responseSpec);
//        when(responseSpec.body(any(ParameterizedTypeReference.class))).thenReturn(apiResponse);
//
//
//        IpcaDataDTO ipcaResult = bcbService.getIpca();
//        double currentMonth = ipcaResult.currentMonth();
//        double currentYear = ipcaResult.accumulatedYear();
//        double last12MonthsSum = ipcaResult.last12MonthsSum();
//        double lasted12MonthsCompound = ipcaResult.last12MonthsCompound();
//
//        assertEquals(0.43, currentMonth);
//        assertEquals(0.43, currentYear);
//        assertEquals(6.42, last12MonthsSum, 0.01);      // soma dos 12
//        assertEquals(6.63, lasted12MonthsCompound, 0.05); // composto dos 12
//    }
//
//
//    @Test
//    void returnSelicComposed(){
//        // Service - dto direto
//        List<Map<String, String>> apiResponse = List.of(
//                Map.of("data", "19/05/2026", "valor", "4.17")
//        );
//        when(restClient.get()).thenReturn(requestHeadersUriSpec);
//        when(requestHeadersUriSpec.uri(anyString())).thenReturn(requestHeadersUriSpec);
//        when(requestHeadersUriSpec.retrieve()).thenReturn(responseSpec);
//        when(responseSpec.body(any(ParameterizedTypeReference.class))).thenReturn(apiResponse);
//
//        SelicDataDTO selicResult = bcbService.getSelic();
//
//        double currentRate = selicResult.currentRate();
//        double accumulatedMonth = selicResult.accumulatedMonth();
//        double accumulatedYear = selicResult.accumulatedYear();
//        double last12MonthsCompound = selicResult.last12MonthsCompound();
//
//        assertEquals(4.17, currentRate);
//        assertEquals(4.17, accumulatedMonth);
//        assertEquals(4.17, accumulatedYear);
//        assertEquals(4.17, last12MonthsCompound, 0.01);
//
//    }
//}
