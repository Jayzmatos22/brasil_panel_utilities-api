package com.brasilpanel.backend.controller.api;

import com.brasilpanel.backend.dto.api.ibge.PibEstadualDTO;
import com.brasilpanel.backend.service.api.sidra.SidraService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RequestMapping("/api/sidra")
@RestController
@RequiredArgsConstructor
public class SidraController {
    private final SidraService sidraService;

    @Operation(summary = "PIB por estado", description = "PIB por UF do ano mais recente (IBGE/SIDRA), do maior para o menor")
    @ApiResponse(responseCode = "200", description = "PIB por estado retornado com sucesso")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com o SIDRA")
    @GetMapping("/pib-estados")
    public ResponseEntity<List<PibEstadualDTO>> getPibPorEstado() {
        return ResponseEntity.ok(sidraService.getPibPorEstado());
    }
}