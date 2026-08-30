package com.brasilpanel.backend.controller.api;

import com.brasilpanel.backend.service.api.ipea.IpeaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

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

    /**
     * Diagnóstico TEMPORÁRIO de conectividade com o ipeadata.gov.br.
     *
     * <p>As séries do IPEA falham com {@code connect timed out} a partir do datacenter do
     * Render (EUA). Este endpoint distingue as duas causas possíveis a partir da própria
     * rede do Render: resolve o host e tenta um connect TCP cru em cada IP com timeout
     * generoso (10s), medindo o tempo. Latência alta que completa em, digamos, 4s indica
     * que só faltava timeout; falha mesmo com 10s indica bloqueio/rota inexistente.
     *
     * <p>Remover assim que a causa estiver determinada.
     */
    @Operation(summary = "[TEMP] Diagnóstico de conectividade com o IPEA")
    @GetMapping("/_diag")
    public ResponseEntity<Map<String, Object>> diag() {
        String host = "ipeadata.gov.br";
        int port = 80;
        int timeoutMs = 10_000;

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("host", host);
        out.put("port", port);
        out.put("connectTimeoutMs", timeoutMs);

        InetAddress[] addresses;
        try {
            addresses = InetAddress.getAllByName(host);
        } catch (Exception e) {
            out.put("dns", "FALHOU: " + e.getClass().getSimpleName() + ": " + e.getMessage());
            return ResponseEntity.ok(out);
        }

        List<Map<String, Object>> results = new ArrayList<>();
        for (InetAddress addr : addresses) {
            Map<String, Object> r = new LinkedHashMap<>();
            r.put("ip", addr.getHostAddress());
            long start = System.nanoTime();
            try (Socket socket = new Socket()) {
                socket.connect(new InetSocketAddress(addr, port), timeoutMs);
                long ms = (System.nanoTime() - start) / 1_000_000;
                r.put("resultado", "CONECTOU");
                r.put("tempoMs", ms);
            } catch (Exception e) {
                long ms = (System.nanoTime() - start) / 1_000_000;
                r.put("resultado", "FALHOU");
                r.put("tempoMs", ms);
                r.put("erro", e.getClass().getSimpleName() + ": " + e.getMessage());
            }
            results.add(r);
        }
        out.put("dns", addresses.length + " endereço(s) resolvido(s)");
        out.put("tentativas", results);
        return ResponseEntity.ok(out);
    }
}
