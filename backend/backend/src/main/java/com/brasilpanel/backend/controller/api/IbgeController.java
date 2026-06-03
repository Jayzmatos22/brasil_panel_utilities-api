package com.brasilpanel.backend.controller.api;

import com.brasilpanel.backend.dto.api.ibge.EstadoDTO;
import com.brasilpanel.backend.dto.api.ibge.EstadoRankingDTO;
import com.brasilpanel.backend.dto.api.ibge.MunicipioDTO;
import com.brasilpanel.backend.service.static_data.StaticDataService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequestMapping("/api/ibge")
@RestController
@RequiredArgsConstructor
public class IbgeController {
    private final StaticDataService staticDataService;

    @Operation(summary = "Todos os estados", description = "Retorna todos os estados brasileiros com região")
    @ApiResponse(responseCode = "200", description = "Lista de estados retornada com sucesso")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com IBGE")
    @GetMapping
    public ResponseEntity<List<EstadoDTO>> getAllStates() {
        return ResponseEntity.ok(staticDataService.getAllStates());
    }

    @Operation(summary = "Ranking de estados por municípios", description = "Estados ordenados pelo nº de municípios, do maior para o menor")
    @ApiResponse(responseCode = "200", description = "Ranking retornado com sucesso")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com IBGE")
    @GetMapping("/states/ranking")
    public ResponseEntity<List<EstadoRankingDTO>> getStatesRanking() {
        return ResponseEntity.ok(staticDataService.getStatesRanking());
    }

    @Operation(summary = "Municípios por estado", description = "Retorna municípios de um estado pelo ID ou sigla. Filtro opcional por nome.")
    @ApiResponse(responseCode = "200", description = "Lista de municípios retornada com sucesso")
    @ApiResponse(responseCode = "400", description = "ID ou sigla do estado inválido")
    @ApiResponse(responseCode = "404", description = "Nenhum município encontrado")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com IBGE")
    @GetMapping("/states/{state}/cities")
    public ResponseEntity<List<MunicipioDTO>> getCitiesByState(
            @PathVariable String state,
            @RequestParam(required = false) String filtro) {
        return ResponseEntity.ok(staticDataService.getCitiesByState(state, filtro));
    }


}
