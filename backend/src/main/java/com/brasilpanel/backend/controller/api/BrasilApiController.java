package com.brasilpanel.backend.controller.api;

import com.brasilpanel.backend.dto.api.brasilAPI.BankDTO;
import com.brasilpanel.backend.service.api.brasilAPI.BrasilAPIService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/banks")
@RequiredArgsConstructor
public class BrasilApiController {
    private final BrasilAPIService brasilAPIService;


    @Operation(summary = "Retorna todos os bancos no BrasilAPI", description = "Somente os que possuem nome e código")
    @ApiResponse(responseCode = "200", description = "API fornece lista extensa de bancos com 4 campos cada:" +
            "isbp, name, code, fullName")
    @ApiResponse(responseCode = "502", description = "Erro desconhecido na comunicação com a API BrasilAPI")
    @GetMapping
    public ResponseEntity<List<BankDTO>> returnBanks(){
        return ResponseEntity.ok(brasilAPIService.returnAllBanks());
    }
}
