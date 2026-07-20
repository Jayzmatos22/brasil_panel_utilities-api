package com.brasilpanel.backend.controller.api;

import com.brasilpanel.backend.service.api.ipea.IpeaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/ipea")
public class IpeaAdminController {

    private final IpeaService ipeaService;

    @PostMapping("/refresh")
    public ResponseEntity<String> refreshAll() {
        ipeaService.refreshAll();
        return ResponseEntity.ok("Refresh concluído");
    }
}
