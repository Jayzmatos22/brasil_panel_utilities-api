package com.brasilpanel.backend.controller.api;

import com.brasilpanel.backend.dto.api.ipea.IpeaSerieDTO;
import com.brasilpanel.backend.service.api.ipea.IpeaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/ipea")
@RequiredArgsConstructor
@Tag(name = "IPEA", description = "Séries econômicas e sociais do Brasil — IPEA Data")
public class IpeaController {
    private final IpeaService ipeaService;

    @Operation(summary = "Emprego", description = "Taxa de desocupação e nível de ocupação — PNAD Contínua mensal")
    @ApiResponse(responseCode = "200", description = "Séries retornadas com sucesso")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com IPEA")
    @GetMapping("/emprego")
    public ResponseEntity<List<IpeaSerieDTO>> getEmprego() {
        return ResponseEntity.ok(ipeaService.getEmprego());
    }

    @Operation(summary = "Renda", description = "Salário mínimo real, salário mínimo PPC e renda domiciliar per capita")
    @ApiResponse(responseCode = "200", description = "Séries retornadas com sucesso")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com IPEA")
    @GetMapping("/renda")
    public ResponseEntity<List<IpeaSerieDTO>> getRenda() {
        return ResponseEntity.ok(ipeaService.getRenda());
    }

    @Operation(summary = "Desigualdade e pobreza", description = "Coeficiente de Gini e taxa de pobreza anual")
    @ApiResponse(responseCode = "200", description = "Séries retornadas com sucesso")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com IPEA")
    @GetMapping("/desigualdade")
    public ResponseEntity<List<IpeaSerieDTO>> getDesigualdade() {
        return ResponseEntity.ok(ipeaService.getDesigualdade());
    }

    @Operation(summary = "Macroeconomia", description = "PIB, investimento, desemprego FMI, Selic, reservas internacionais e arrecadação federal")
    @ApiResponse(responseCode = "200", description = "Séries retornadas com sucesso")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com IPEA")
    @GetMapping("/macro")
    public ResponseEntity<List<IpeaSerieDTO>> getMacro() {
        return ResponseEntity.ok(ipeaService.getMacro());
    }

    @Operation(summary = "Preços", description = "INPC e IGP-M — índices de inflação mensais")
    @ApiResponse(responseCode = "200", description = "Séries retornadas com sucesso")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com IPEA")
    @GetMapping("/precos")
    public ResponseEntity<List<IpeaSerieDTO>> getPrecos() {
        return ResponseEntity.ok(ipeaService.getPrecos());
    }

    @Operation(summary = "População", description = "População total mensal e projeções até 2070 por sexo")
    @ApiResponse(responseCode = "200", description = "Séries retornadas com sucesso")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com IPEA")
    @GetMapping("/populacao")
    public ResponseEntity<List<IpeaSerieDTO>> getPopulacao() {
        return ResponseEntity.ok(ipeaService.getPopulacao());
    }
}