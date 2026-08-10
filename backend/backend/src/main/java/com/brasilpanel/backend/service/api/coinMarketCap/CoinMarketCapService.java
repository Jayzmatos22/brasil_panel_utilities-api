package com.brasilpanel.backend.service.api.coinMarketCap;

import com.brasilpanel.backend.dto.api.coinMarketCap.CmcGlobalDTO;
import com.brasilpanel.backend.dto.api.coinMarketCap.CmcListingDTO;
import com.brasilpanel.backend.dto.api.coinMarketCap.CmcMarketDTO;
import com.brasilpanel.backend.dto.api.coinMarketCap.CmcResponseDTO;
import com.brasilpanel.backend.dto.api.coinMarketCap.CmcStatusDTO;
import com.brasilpanel.backend.exception.customized.CoinMarketCapException;
import com.brasilpanel.backend.exception.customized.CoinMarketCapNotFoundException;
import com.brasilpanel.backend.model.CmcCryptoSnapshot;
import com.brasilpanel.backend.service.financial.DbFirst;
import com.brasilpanel.backend.service.financial.SnapshotFreshness;
import com.brasilpanel.backend.service.financial.SnapshotService;
import com.brasilpanel.backend.validators.api.CryptoCoinMarketCap;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpRequest;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Integração com a CoinMarketCap (plano Basic).
 *
 * <p><b>Cota:</b> 15.000 créditos/mês, 50 req/min, 1 conversão de moeda por chamada.
 * O top 100 cabe em 1 crédito (a cobrança é de 1 crédito por 200 data points), então
 * um refresh a cada 10 min custa ~4.320 créditos/mês — 29% da cota.
 *
 * <p><b>A leitura é DB-first.</b> O scheduler reabastece a tabela e as consultas de
 * usuário são servidas do banco. A leitura só toca a API em dois casos: primeiro boot,
 * com a tabela vazia, e batch mais velho que {@link #JANELA_LISTINGS} — que na prática
 * significa scheduler parado, já que ele roda de 10 em 10 minutos.
 *
 * <p>Busca por termo <b>nunca</b> vai à API: {@code /api/coinmarketcap/**} é público, e
 * um termo desconhecido custando 1 crédito deixaria qualquer um esvaziar a cota do mês
 * iterando símbolos inexistentes — o que derrubaria também o refresh do scheduler.
 * Moeda fora do batch acompanhado é 404.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class CoinMarketCapService {

    private static final String LISTINGS_URL =
            "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest";

    /** Header de autenticação da CoinMarketCap — a chave nunca vai na URL, que é logada. */
    private static final String API_KEY_HEADER = "X-CMC_PRO_API_KEY";

    /** Moeda de referência. O plano Basic aceita apenas 1 conversão por chamada. */
    static final String BRL = "BRL";

    /** Padrão público do CDN de logos — evita gastar créditos com /cryptocurrency/info. */
    private static final String LOGO_URL_PATTERN =
            "https://s2.coinmarketcap.com/static/img/coins/64x64/%d.png";

    /**
     * Por quanto tempo o batch salvo é servido sem reconferir a fonte.
     *
     * <p>Deliberadamente muito maior que o cron do scheduler (10 min): quem reabastece
     * o banco é ele, e esta janela só precisa agir quando ele para. Uma hora dá 6
     * ciclos de folga, então falha transitória da CMC não vira crédito gasto na
     * leitura — e um cache derrubado por restart também não. Encurtar isso transforma
     * qualquer soluço do scheduler em consumo de cota.
     */
    static final Duration JANELA_LISTINGS = Duration.ofHours(1);

    private final RestClient restClient;
    private final SnapshotService snapshotService;
    private final CryptoCoinMarketCap validator;
    private final CmcCreditGuard creditGuard;

    @Value("${coinmarketcap.api-key:}")
    private String apiKey;

    @Value("${coinmarketcap.listing-limit:100}")
    private int listingLimit;

    /**
     * Sem chave configurada a fonte fica inteiramente desligada, sem derrubar a aplicação —
     * o painel continua funcionando só com o CoinGecko.
     */
    public boolean isEnabled() {
        return apiKey != null && !apiKey.isBlank();
    }

    /** URL do logo de uma moeda, derivada do id — não custa crédito nem vai ao banco. */
    public static String logoUrl(Integer cmcId) {
        return cmcId != null ? LOGO_URL_PATTERN.formatted(cmcId) : null;
    }

    // ── Leitura (DB-first) ──────────────────────────────────────────────────

    /**
     * Ranking por market cap servido do último batch salvo, enquanto ele valer.
     *
     * <p>Vencido o batch, busca na fonte; se a busca falhar e houver batch salvo,
     * devolve o antigo com log de aviso em vez de derrubar a resposta. Antes disso o
     * batch era servido para sempre, sem nenhuma checagem de idade.
     *
     * @return lista vazia quando a fonte está desligada — cabe ao frontend sinalizar
     */
    @Cacheable("cmc-listings")
    public List<CmcMarketDTO> returnAllCryptos() {
        List<CmcCryptoSnapshot> latest = snapshotService.getLatestCmcBatch();
        LocalDateTime buscadoEm = latest.isEmpty() ? null : latest.getFirst().getFetchedAt();

        return DbFirst.serve(
                "CoinMarketCap listings",
                latest.isEmpty() ? Optional.empty() : Optional.of(toMarketDTOs(latest)),
                SnapshotFreshness.isStale(buscadoEm, JANELA_LISTINGS),
                buscadoEm != null ? buscadoEm.toLocalDate() : null,
                () -> {
                    refreshListings();
                    return toMarketDTOs(snapshotService.getLatestCmcBatch());
                });
    }

    private static List<CmcMarketDTO> toMarketDTOs(List<CmcCryptoSnapshot> batch) {
        return batch.stream().map(CoinMarketCapService::toMarketDTO).toList();
    }

    /**
     * Busca por símbolo, slug ou nome, estritamente dentro do batch acompanhado.
     *
     * @throws CoinMarketCapNotFoundException quando a moeda não está no batch — de
     *         propósito, em vez de cotá-la na API (ver nota de cota na classe)
     */
    @Cacheable(value = "cmc-quote-by-symbol", key = "#term")
    public CmcMarketDTO returnCryptoByTerm(String term) {
        validator.validTerm(term);

        return snapshotService.getLatestCmcCrypto(term)
                .map(CoinMarketCapService::toMarketDTO)
                .orElseThrow(() -> new CoinMarketCapNotFoundException(
                        "Criptomoeda '" + term + "' não encontrada"));
    }

    /**
     * Panorama do mercado derivado do batch — não consome crédito.
     * O market cap total sai da dominância: {@code marketCap ÷ dominância × 100}.
     */
    @Cacheable("cmc-global")
    public CmcGlobalDTO returnGlobalStats() {
        List<CmcCryptoSnapshot> batch = snapshotService.getLatestCmcBatch();
        if (batch.isEmpty()) {
            throw new CoinMarketCapException("Nenhum dado da CoinMarketCap disponível");
        }

        // A moeda de maior market cap é a que dá a estimativa mais estável do total:
        // quanto maior a fatia, menor o efeito do arredondamento da dominância.
        Optional<CmcCryptoSnapshot> anchor = batch.stream()
                .filter(s -> s.getMarketCap() != null && s.getMarketCapDominance() != null
                          && s.getMarketCapDominance().signum() > 0)
                .max((a, b) -> a.getMarketCap().compareTo(b.getMarketCap()));

        Double totalMarketCap = anchor
                .map(s -> s.getMarketCap().doubleValue() * 100.0 / s.getMarketCapDominance().doubleValue())
                .orElse(null);

        Double btcDominance = batch.stream()
                .filter(s -> "BTC".equalsIgnoreCase(s.getSymbol()))
                .map(CmcCryptoSnapshot::getMarketCapDominance)
                .filter(java.util.Objects::nonNull)
                .findFirst()
                .map(BigDecimal::doubleValue)
                .orElse(null);

        double volume = batch.stream()
                .map(CmcCryptoSnapshot::getVolume24h)
                .filter(java.util.Objects::nonNull)
                .mapToDouble(BigDecimal::doubleValue)
                .sum();

        return new CmcGlobalDTO(
                totalMarketCap,
                btcDominance,
                volume,
                batch.size(),
                batch.get(0).getFetchedAt());
    }

    // ── Escrita (consome créditos) ──────────────────────────────────────────

    /**
     * Busca o ranking por market cap na API e persiste um novo batch.
     * Consome 1 crédito por chamada. Usado pelo scheduler; não expor a usuários.
     *
     * @return as moedas retornadas, ou lista vazia se a fonte está desligada ou sem orçamento
     */
    public List<CmcListingDTO> refreshListings() {
        if (!isEnabled()) {
            log.debug("CoinMarketCap desligada (coinmarketcap.api-key ausente) — refresh ignorado");
            return List.of();
        }
        if (!creditGuard.hasBudget()) {
            return List.of();
        }

        String uri = LISTINGS_URL + "?start=1&limit=" + listingLimit + "&convert=" + BRL;

        try {
            CmcResponseDTO<List<CmcListingDTO>> response = restClient.get()
                    .uri(uri)
                    .header(API_KEY_HEADER, apiKey)
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, this::handleErrorResponse)
                    .body(new ParameterizedTypeReference<CmcResponseDTO<List<CmcListingDTO>>>() {});

            List<CmcListingDTO> data = validateList(response);

            snapshotService.saveCmcListings(data, BRL);
            return data;

        } catch (CoinMarketCapException e) {
            throw e;
        } catch (Exception e) {
            log.error("Erro ao buscar listagem da CoinMarketCap: {}", e.getMessage());
            throw new CoinMarketCapException("Erro na comunicação com a CoinMarketCap");
        }
    }

    // ── Validação e erros ───────────────────────────────────────────────────

    private void handleErrorResponse(HttpRequest request, ClientHttpResponse httpResponse)
            throws IOException {
        // O corpo de erro da CMC traz error_message, mas nunca a chave — ela viaja
        // em header, então logar isto é seguro.
        String body = new String(httpResponse.getBody().readAllBytes(), StandardCharsets.UTF_8);
        log.error("CoinMarketCap respondeu {} — {}", httpResponse.getStatusCode(), body);
        throw new CoinMarketCapException("Erro na comunicação com a CoinMarketCap");
    }

    private List<CmcListingDTO> validateList(CmcResponseDTO<List<CmcListingDTO>> response) {
        List<CmcListingDTO> data = validateEnvelope(response);
        if (data.isEmpty()) {
            throw new CoinMarketCapException("Nenhuma criptomoeda encontrada");
        }
        log.info("CoinMarketCap: {} moedas recebidas", data.size());
        return data;
    }

    /**
     * Valida o envelope e registra o custo real da chamada.
     * A CMC pode responder HTTP 200 com error_code != 0 — checar só o status HTTP não basta.
     */
    private <T> T validateEnvelope(CmcResponseDTO<T> response) {
        if (response == null || response.status() == null) {
            throw new CoinMarketCapException("Resposta vazia da CoinMarketCap");
        }

        CmcStatusDTO status = response.status();

        // Registrado antes de qualquer validação: mesmo resposta de erro pode ter cobrado.
        creditGuard.record(status.creditCount());

        if (!status.isSuccess()) {
            log.error("CoinMarketCap retornou erro {} — {}", status.errorCode(), status.errorMessage());
            throw new CoinMarketCapException("Erro na comunicação com a CoinMarketCap");
        }
        if (response.data() == null) {
            throw new CoinMarketCapException("Nenhuma criptomoeda encontrada");
        }
        return response.data();
    }

    // ── Reconstrução DB/API → DTO ───────────────────────────────────────────

    private static CmcMarketDTO toMarketDTO(CmcCryptoSnapshot s) {
        return new CmcMarketDTO(
                s.getCmcId(),
                s.getSymbol(),
                s.getName(),
                s.getSlug(),
                s.getCmcRank(),
                bd(s.getCurrentPrice()),
                bd(s.getMarketCap()),
                bd(s.getVolume24h()),
                bd(s.getPercentChange1h()),
                bd(s.getPercentChange24h()),
                bd(s.getPercentChange7d()),
                bd(s.getMarketCapDominance()),
                logoUrl(s.getCmcId()),
                s.getFetchedAt());
    }

    private static Double bd(BigDecimal v) {
        return v != null ? v.doubleValue() : null;
    }
}