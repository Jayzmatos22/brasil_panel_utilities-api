package com.brasilpanel.backend.controller.api;


import com.brasilpanel.backend.dto.api.bcb.*;
import com.brasilpanel.backend.service.api.bcb.BcbService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RequestMapping("/api/bcb")
@RestController
@RequiredArgsConstructor
public class BcbController {

    private final BcbService bcbService;

    // Tested
    @Operation(summary = "Buscar taxa DollarPtax", description = "Busca a taxa DollarPtax vigente na API do Banco Central")
    @ApiResponse(responseCode = "200", description = "Dados retornam com sucesso: data e valor")
    @ApiResponse(responseCode = "502", description = "Erro desconhecido na comunicação com a API")
    @GetMapping("/dollar/ptax")
    public ResponseEntity<DollarPtaxDTO> getDollar(){
        return ResponseEntity.ok(bcbService.getDollarPtax());
    }

    // Tested
    @Operation(summary = "Buscar taxa CDI", description = "Busca a taxa CDI na data vigente na API do Banco Central")
    @ApiResponse(responseCode = "200", description = "Dados retornam com sucesso: data e valor")
    @ApiResponse(responseCode = "502", description = "Erro desconhecido na comunicação com a API")
    @GetMapping("/cdi")
    public ResponseEntity<CdiDataDTO> getCdiRate(){
        return ResponseEntity.ok(bcbService.getCdiRate());
    }


    @Operation(summary = "Buscar taxa Selic composta", description = "Busca a taxa Selic em formato SelicDataDTO")
    @ApiResponse(responseCode = "200", description = "Dados retornam com sucesso: data e valor")
    @ApiResponse(responseCode = "502", description = "Erro desconhecido na comunicação com a API")
    @GetMapping("/selic")
    public ResponseEntity<SelicDataDTO> getSelicComposed(){
        return ResponseEntity.ok(bcbService.getSelic());
    }


    @Operation(summary = "Buscar taxa IPCA", description = "Busca a taxa IPCA mensal, anual até a data vigente e dos 12 meses composto")
    @ApiResponse(responseCode = "200", description = "Dados retornam com sucesso: json com os 3 corpos")
    @ApiResponse(responseCode = "502", description = "Erro desconhecido na comunicação com a API")
    @GetMapping("/ipca")
    public ResponseEntity<IpcaDataDTO> getIpcaComposed(){
        return ResponseEntity.ok(bcbService.getIpca());
    }

    @Operation(summary = "Buscar taxa Selic dos últimos 12 meses", description = "Busca Selic nos últimos 12 meses")
    @ApiResponse(responseCode = "200", description = "Dados retornam com sucesso: json com os 12 corpos com data e valor")
    @ApiResponse(responseCode = "502", description = "Erro desconhecido na comunicação com a API")
    @GetMapping("/selic/history")
    public ResponseEntity<List<SelicHistoryDTO>> getSelicLast12Months() {
        return ResponseEntity.ok(bcbService.getSelicHistory());
    }

}
