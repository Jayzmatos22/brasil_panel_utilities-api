package com.brasilpanel.backend.service.api.metalsDev;


import com.brasilpanel.backend.dto.api.metalsDev.MetalsDataDTO;
import com.brasilpanel.backend.dto.api.metalsDev.MetalsResponseDTO;
import com.brasilpanel.backend.exception.customized.MetalsException;
import com.brasilpanel.backend.model.MetalSnapshot;
import com.brasilpanel.backend.service.financial.SnapshotService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class MetalsDevService {
    private final RestClient restClient;
    private final SnapshotService snapshotService;

    @Value("${metals.api-key}")
    private String apiKey;

    @Cacheable("metals")
    public MetalsDataDTO getMetals() {
        // DB-first: serve o snapshot mais recente; só chama a API se o banco estiver vazio.
        // Crítico para a cota de 100 req/mês — leituras não consomem a API.
        Optional<MetalSnapshot> latest = snapshotService.getLatestMetals();
        if (latest.isPresent()) {
            return toDTO(latest.get());
        }
        return refreshMetals();
    }

    /**
     * Busca os preços na API e persiste, ignorando o atalho DB-first.
     * Usado pelo scheduler para re-alimentar o banco e como fallback de leitura.
     */
    public MetalsDataDTO refreshMetals() {
        String url = "https://api.metals.dev/v1/latest?api_key=" + apiKey
                + "&currency=BRL&unit=toz";
        try {
            MetalsResponseDTO response = restClient.get()
                    .uri(url)
                    .retrieve()
                    .body(MetalsResponseDTO.class);

            if (response == null || response.metals() == null) {
                throw new MetalsException("Nenhuma metal encontrado", 502);
            }

            if (!"success".equals(response.status())) {
                throw new MetalsException("Erro na API de metais", 502);
            }

            MetalsDataDTO metalsData = new MetalsDataDTO(
                    response.metals().gold(),
                    response.metals().silver(),
                    response.metals().platinum(),
                    response.metals().palladium(),
                    response.metals().copper(),
                    response.metals().aluminum(),
                    response.metals().nickel(),
                    response.metals().zinc(),
                    response.timestamps().metal()
            );

            snapshotService.saveMetals(metalsData, response.currency(), response.timestamps().metal());
            return metalsData;

        } catch (MetalsException e) {
            throw e;
        } catch (Exception e) {
            log.error("Erro ao buscar metais: {}", e.getMessage());
            throw new MetalsException("Erro na comunicação com a API de metais", 502);
        }
    }

    // ── Reconstrução DB → DTO ──────────────────────────────────────────────

    private MetalsDataDTO toDTO(MetalSnapshot s) {
        return new MetalsDataDTO(
                bd(s.getGold()), bd(s.getSilver()), bd(s.getPlatinum()), bd(s.getPalladium()),
                bd(s.getCopper()), bd(s.getAluminum()), bd(s.getNickel()), bd(s.getZinc()),
                s.getReferenceTs()
        );
    }

    private static Double bd(BigDecimal v) {
        return v != null ? v.doubleValue() : null;
    }
}
