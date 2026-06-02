package com.brasilpanel.backend.controller.api;

import com.brasilpanel.backend.dto.api.brasilAPI.BankDTO;
import com.brasilpanel.backend.exception.customized.BrasilApiNotFoundException;
import com.brasilpanel.backend.service.static_data.StaticDataService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.constraints.Positive;

import java.util.List;

@RestController
@RequestMapping("/api/banks")
@RequiredArgsConstructor
public class BrasilApiController {
    private final StaticDataService staticDataService;


    @Operation(summary = "Retorna todos os bancos no BrasilAPI", description = "Somente os que possuem nome e código")
    @ApiResponse(responseCode = "200", description = "API fornece lista extensa de bancos com 4 campos cada:" +
            "isbp, name, code, fullName")
    @ApiResponse(responseCode = "502", description = "Erro desconhecido na comunicação com a API BrasilAPI")
    @GetMapping
    public ResponseEntity<List<BankDTO>> getAllBanks(){
        return ResponseEntity.ok(staticDataService.getAllBanks());
    }


    @Operation(summary = "Buscar banco por código", description = "Retorna um banco pelo código COMPE")
    @ApiResponse(responseCode = "200", description = "Banco encontrado")
    @ApiResponse(responseCode = "404", description = "Banco não encontrado")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com a API BrasilAPI")
    @GetMapping("/{code}")
    public ResponseEntity<BankDTO> getBankByCode(@PathVariable @Positive int code){
        return ResponseEntity.ok(staticDataService.getBankByCode(code)
                .orElseThrow(() -> new BrasilApiNotFoundException("Banco com código " + code + " não encontrado")));
    }
}
