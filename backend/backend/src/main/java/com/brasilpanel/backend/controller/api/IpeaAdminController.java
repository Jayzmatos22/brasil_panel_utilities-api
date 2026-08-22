package com.brasilpanel.backend.controller.api;

import com.brasilpanel.backend.service.api.ipea.IpeaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Disparo manual do refresh das séries do IPEA.
 *
 * <p>Mora sob {@code /api/admin} de propósito. Antes ficava em {@code /api/ipea/refresh},
 * que o {@code SecurityConfig} libera com {@code permitAll} junto com as ~50 rotas de
 * leitura do IPEA — ou seja, qualquer um na internet disparava as 57 buscas sequenciais
 * de {@link IpeaService#refreshAll()} contra o ipeadata.gov.br, prendendo uma thread do
 * Tomcat por dezenas de segundos a cada chamada.
 *
 * <p>O caminho normal de atualização continua sendo o {@code IpeaScheduler} (todo dia às
 * 05:00). Este endpoint existe só para forçar o ciclo fora do horário.
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/ipea")
@PreAuthorize("hasRole('ADMIN')")
public class IpeaAdminController {

    private final IpeaService ipeaService;

    @Operation(summary = "Forçar refresh das séries do IPEA",
               description = "Busca todas as séries na API do IPEA e persiste os pontos novos. "
                           + "Operação longa (57 séries em sequência) — exige ROLE_ADMIN.")
    @ApiResponse(responseCode = "200", description = "Refresh concluído")
    @ApiResponse(responseCode = "401", description = "Sem sessão")
    @ApiResponse(responseCode = "403", description = "Sessão sem ROLE_ADMIN")
    @PostMapping("/refresh")
    public ResponseEntity<String> refreshAll() {
        ipeaService.refreshAll();
        return ResponseEntity.ok("Refresh concluído");
    }
}
