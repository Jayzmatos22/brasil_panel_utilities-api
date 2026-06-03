package com.brasilpanel.backend.controller.api;

import com.brasilpanel.backend.dto.api.worldbank.PibBrasilDTO;
import com.brasilpanel.backend.service.api.worlBank.WorldBankService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RequestMapping("/api/worldbank")
@RestController
@RequiredArgsConstructor
public class WorldBankController {
    private final WorldBankService worldBankService;

    @GetMapping
    public ResponseEntity<PibBrasilDTO> getCurrentPibBrazil(){
        return ResponseEntity.ok(worldBankService.getCurrentPib());
    }

    @GetMapping("/series")
    public ResponseEntity<List<PibBrasilDTO>> getPibSeries(){
        return ResponseEntity.ok(worldBankService.getPibSeries());
    }

    @GetMapping("/{year}")
    public ResponseEntity<PibBrasilDTO> getPibBrazilByYear(
            @PathVariable Integer year
    ){
        return ResponseEntity.ok(worldBankService.getPibByYear(year));
    }
}
