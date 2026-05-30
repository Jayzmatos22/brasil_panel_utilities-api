package com.brasilpanel.backend.controller.api;

import com.brasilpanel.backend.dto.api.metalsDev.MetalsDataDTO;
import com.brasilpanel.backend.service.api.metalsDev.MetalsDevService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/metals")
public class MetalsController {
    private final MetalsDevService metalsDevService;


    @Operation(summary = "Cotação de metais", description = "Retorna ouro, prata, platina, paládio, cobre, alumínio, níquel e zinco em BRL/toz. Cache semanal.")
    @ApiResponse(responseCode = "200", description = "Cotações retornadas com sucesso")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com a API")
    @GetMapping
    public ResponseEntity<MetalsDataDTO> getMetals() {
        return ResponseEntity.ok(metalsDevService.getMetals());
    }

}
