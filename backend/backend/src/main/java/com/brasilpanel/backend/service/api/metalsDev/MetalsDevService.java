package com.brasilpanel.backend.service.api.metalsDev;


import com.brasilpanel.backend.dto.api.metalsDev.LbmaAuthorityResponseDTO;
import com.brasilpanel.backend.dto.api.metalsDev.LbmaFixingDTO;
import com.brasilpanel.backend.dto.api.metalsDev.MetalHistoryDTO;
import com.brasilpanel.backend.dto.api.metalsDev.MetalHistoryPointDTO;
import com.brasilpanel.backend.dto.api.metalsDev.MetalsDataDTO;
import com.brasilpanel.backend.dto.api.metalsDev.MetalsResponseDTO;
import com.brasilpanel.backend.dto.api.metalsDev.MetalsTimeseriesResponseDTO;
import com.brasilpanel.backend.exception.customized.MetalsException;
import com.brasilpanel.backend.model.LbmaFixingSnapshot;
import com.brasilpanel.backend.model.MetalHistorySnapshot;
import com.brasilpanel.backend.model.MetalSnapshot;
import com.brasilpanel.backend.service.financial.DbFirst;
import com.brasilpanel.backend.service.financial.SnapshotFreshness;
import com.brasilpanel.backend.service.financial.SnapshotService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class MetalsDevService {
    private final RestClient restClient;
    private final SnapshotService snapshotService;

    @Value("${metals.api-key}")
    private String apiKey;

    // Ver getMetals: scheduler semanal + cota de ~100 req/mês pedem folga larga.
    static final Duration JANELA_METAIS = Duration.ofDays(10);

    // Ver getLbmaFixing: cobre fim de semana e feriado prolongado, quando não há
    // fixing publicado para buscar.
    static final Duration JANELA_LBMA = Duration.ofDays(5);

    /**
     * Cotação de metais servida do banco enquanto valer.
     *
     * <p>A janela é generosa de propósito. O scheduler roda <b>uma vez por semana</b>
     * (segunda, 08:00) e a cota do plano free é de ~100 req/mês, já quase toda
     * comprometida entre esse refresh, os dois fixings diários e o histórico. Dez dias
     * dão folga para uma segunda-feira perdida sem que a leitura comece a consumir
     * cota; só uma semana inteira sem refresh faz a leitura reabastecer.
     *
     * <p>Antes disso o snapshot era servido para sempre: com o scheduler quebrado, o
     * painel exibiria a mesma cotação indefinidamente, sem nunca tentar de novo.
     */
    @Cacheable("metals")
    public MetalsDataDTO getMetals() {
        Optional<MetalSnapshot> latest = snapshotService.getLatestMetals();
        LocalDateTime buscadoEm = latest.map(MetalSnapshot::getFetchedAt).orElse(null);

        return DbFirst.serve(
                "Metais (Metals Dev)",
                latest.map(this::toDTO),
                SnapshotFreshness.isStale(buscadoEm, JANELA_METAIS),
                buscadoEm != null ? buscadoEm.toLocalDate() : null,
                this::refreshMetals);
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

    // ── Histórico (timeseries) ──────────────────────────────────────────────

    private static final DateTimeFormatter ISO_DATE = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    // Janela do gráfico: 30 dias = 1 requisição (limite do endpoint), econômico
    // para a cota free (~100 req/mês).
    private static final int HISTORY_DAYS = 30;

    // Série diária muda 1x/dia → janela longa de frescor evita rebuscar à toa.
    private static final Duration HISTORY_FRESHNESS = Duration.ofHours(12);

    @Cacheable(value = "metals-history", sync = true)
    public MetalHistoryDTO getMetalHistory() {
        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(HISTORY_DAYS - 1L);

        // DB-first: serve do banco se a série existe e o ponto mais novo é recente
        List<MetalHistorySnapshot> series = snapshotService.getMetalHistorySeries(start, end);
        if (!series.isEmpty() && isHistoryFresh(series.get(series.size() - 1))) {
            return toHistoryDTO(series);
        }

        String url = "https://api.metals.dev/v1/timeseries?api_key=" + apiKey
                + "&start_date=" + start.format(ISO_DATE)
                + "&end_date=" + end.format(ISO_DATE);

        try {
            MetalsTimeseriesResponseDTO response = restClient.get()
                    .uri(url)
                    .retrieve()
                    .body(MetalsTimeseriesResponseDTO.class);

            if (response == null || !"success".equals(response.status()) || response.rates() == null) {
                throw new MetalsException("Erro na API de metais (timeseries)", 502);
            }

            List<MetalHistoryPointDTO> points = new ArrayList<>(response.rates().size());
            response.rates().forEach((date, day) -> {
                Map<String, BigDecimal> m = day.metals() != null ? day.metals() : Map.of();
                points.add(new MetalHistoryPointDTO(
                        date,
                        dval(m, "gold"), dval(m, "silver"), dval(m, "platinum"), dval(m, "palladium"),
                        dval(m, "copper"), dval(m, "aluminum"), dval(m, "nickel"), dval(m, "zinc")
                ));
            });
            points.sort(Comparator.comparing(MetalHistoryPointDTO::date));

            snapshotService.saveMetalHistory(points, response.currency(), response.unit());
            log.info("Histórico de metais obtido: {} dias", points.size());
            return new MetalHistoryDTO(response.currency(), response.unit(), points);

        } catch (MetalsException e) {
            if (!series.isEmpty()) {
                log.warn("Timeseries falhou ({}); servindo histórico de metais do banco", e.getMessage());
                return toHistoryDTO(series);
            }
            throw e;
        } catch (Exception e) {
            log.error("Erro ao buscar histórico de metais: {}", e.getMessage());
            if (!series.isEmpty()) {
                log.warn("Servindo histórico de metais do banco após erro de comunicação");
                return toHistoryDTO(series);
            }
            throw new MetalsException("Erro na comunicação com a API de metais", 502);
        }
    }

    private boolean isHistoryFresh(MetalHistorySnapshot s) {
        return !SnapshotFreshness.isStale(s.getFetchedAt(), HISTORY_FRESHNESS);
    }

    private MetalHistoryDTO toHistoryDTO(List<MetalHistorySnapshot> series) {
        List<MetalHistoryPointDTO> points = series.stream()
                .map(s -> new MetalHistoryPointDTO(
                        s.getPriceDate().format(ISO_DATE),
                        bd(s.getGold()), bd(s.getSilver()), bd(s.getPlatinum()), bd(s.getPalladium()),
                        bd(s.getCopper()), bd(s.getAluminum()), bd(s.getNickel()), bd(s.getZinc())
                ))
                .toList();
        String currency = series.get(0).getCurrency();
        String unit = series.get(0).getUnit();
        return new MetalHistoryDTO(currency, unit, points);
    }

    private static Double dval(Map<String, BigDecimal> m, String key) {
        BigDecimal v = m.get(key);
        return v != null ? v.doubleValue() : null;
    }

    // ── Fixing LBMA (authority) ─────────────────────────────────────────────

    /**
     * Fixing LBMA servido do banco enquanto valer.
     *
     * <p>Cinco dias porque o fixing só existe em dia útil: de sexta 13:00 até segunda
     * 08:00 já são 67h sem publicação nenhuma, e um feriado prolongado estica isso.
     * Vencer antes disso faria a leitura buscar um fixing que a LBMA não publicou —
     * gasto de cota em troca de nada.
     *
     * <p>Uma janela de calendário ({@code SeriesFreshness}, DIARIA_UTIL) modelaria
     * isso com mais precisão, já que o fixing é publicado por pregão. Ficou de fora
     * porque a cota é de ~100 req/mês: aqui o ganho do passo é passar a degradar, não
     * afinar o instante do vencimento, e o modelo mais preciso erra para o lado caro.
     */
    @Cacheable(value = "lbma-fixing", sync = true)
    public LbmaFixingDTO getLbmaFixing() {
        Optional<LbmaFixingSnapshot> latest = snapshotService.getLatestLbmaFixing();
        LocalDateTime buscadoEm = latest.map(LbmaFixingSnapshot::getFetchedAt).orElse(null);

        return DbFirst.serve(
                "Fixing LBMA",
                latest.map(this::toLbmaDTO),
                SnapshotFreshness.isStale(buscadoEm, JANELA_LBMA),
                buscadoEm != null ? buscadoEm.toLocalDate() : null,
                this::refreshLbmaFixing);
    }

    /**
     * Busca o fixing oficial LBMA na API e persiste, ignorando o atalho DB-first.
     * Uma requisição traz todos os fixings AM/PM (ouro, platina, paládio) + o fixing
     * único da prata.
     *
     * <p>Este é o lado <b>escrita</b>: falha sobe. Antes ele degradava por conta
     * própria, relendo o banco nos dois catches, e isso escondia a falha de quem mais
     * precisava vê-la — o {@code MetalsScheduler} recebia o snapshot antigo como se
     * fosse resultado da busca e registrava "atualizado com sucesso" sem ter
     * atualizado nada. Quem degrada agora é o {@link #getLbmaFixing()}, na leitura.
     */
    public LbmaFixingDTO refreshLbmaFixing() {
        String url = "https://api.metals.dev/v1/metal/authority?api_key=" + apiKey
                + "&authority=lbma";
        try {
            LbmaAuthorityResponseDTO response = restClient.get()
                    .uri(url)
                    .retrieve()
                    .body(LbmaAuthorityResponseDTO.class);

            if (response == null || !"success".equals(response.status()) || response.rates() == null) {
                throw new MetalsException("Erro na API de metais (authority LBMA)", 502);
            }

            Map<String, BigDecimal> r = response.rates();
            Instant ts = response.timestamp();
            LbmaFixingDTO dto = new LbmaFixingDTO(
                    response.currency(),
                    ts,
                    dval(r, "lbma_gold_am"), dval(r, "lbma_gold_pm"),
                    dval(r, "lbma_silver"),
                    dval(r, "lbma_platinum_am"), dval(r, "lbma_platinum_pm"),
                    dval(r, "lbma_palladium_am"), dval(r, "lbma_palladium_pm")
            );

            snapshotService.saveLbmaFixing(dto, ts);
            log.info("Fixing LBMA obtido: ts={}", ts);
            return dto;

        } catch (MetalsException e) {
            throw e;
        } catch (Exception e) {
            log.error("Erro ao buscar fixing LBMA: {}", e.getMessage());
            throw new MetalsException("Erro na comunicação com a API de metais", 502);
        }
    }

    private LbmaFixingDTO toLbmaDTO(LbmaFixingSnapshot s) {
        return new LbmaFixingDTO(
                s.getCurrency(),
                s.getReferenceTs(),
                bd(s.getGoldAm()), bd(s.getGoldPm()),
                bd(s.getSilver()),
                bd(s.getPlatinumAm()), bd(s.getPlatinumPm()),
                bd(s.getPalladiumAm()), bd(s.getPalladiumPm())
        );
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
