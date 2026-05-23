package com.brasilpanel.backend.controller.api;

import com.brasilpanel.backend.dto.api.ibge.EstadoDTO;
import com.brasilpanel.backend.service.api.ibge.IbgeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RequestMapping("/api/ibge")
@RestController
@RequiredArgsConstructor
public class IbgeController {
    private final IbgeService ibgeService;

    @GetMapping
    public ResponseEntity<List<EstadoDTO>> getAllStates(){
        return ResponseEntity.ok(ibgeService.returnAllBrazilianStates());
    }
}
