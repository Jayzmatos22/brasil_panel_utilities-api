package com.brasilpanel.backend.service.api.bcb;

import com.brasilpanel.backend.dto.api.bcb.*;
import com.brasilpanel.backend.exception.customized.BcbApiException;
import com.brasilpanel.backend.model.FinancialDataPoint;
import com.brasilpanel.backend.service.financial.FinancialDataService;
import com.brasilpanel.backend.validators.api.BcbValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;




@RequiredArgsConstructor
@Service
public class BcbService implements BcbImplementations{
    private final RestClient restClient;
    private static final String VALOR = "valor";
    private static final String DATA = "data";
    private static final String SOURCE = "BCB";
    private static final DateTimeFormatter BCB_DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private final BcbValidator bcbValidator;
    private final FinancialDataService financialDataService;



    @Cacheable("selic")
    public SelicDataDTO getSelic() {
        // DB-first: reconstrói o DTO a partir dos pontos salvos (séries 432/1178/4189).
        // O acumulado 12m é recomputado a partir dos últimos 12 pontos diários (série 432).
        Optional<FinancialDataPoint> current = financialDataService.getLastPoint("432", SOURCE);
        Optional<FinancialDataPoint> month   = financialDataService.getLastPoint("1178", SOURCE);
        Optional<FinancialDataPoint> year    = financialDataService.getLastPoint("4189", SOURCE);
        if (current.isPresent() && month.isPresent() && year.isPresent()) {
            // Acumulado 12m: compõe os 12 últimos pontos MENSAIS (série 4390, Selic acum. no mês % a.m.).
            // A 432 é a meta em % a.a.; compô-la como mensal inflava o resultado (~400%).
            List<FinancialDataPoint> history = financialDataService.getRecentPoints("4390", SOURCE, 12);
            if (history.size() == 12) {
                return new SelicDataDTO(
                        current.get().getValue().doubleValue(),
                        month.get().getValue().doubleValue(),
                        year.get().getValue().doubleValue(),
                        compoundPercent(history)
                );
            }
        }
        return refreshSelic();
    }

    /**
     * Busca a SELIC na API e persiste, ignorando o atalho DB-first.
     * Usado pelo scheduler para re-alimentar o banco e como fallback de leitura.
     */
    public SelicDataDTO refreshSelic() {
        try {
            List<SelicHistoryDTO> currentApi = fetchSelic("432", 1);
            Thread.sleep(1200);
            List<SelicHistoryDTO> monthApi   = fetchSelic("1178", 1);
            Thread.sleep(1200);
            List<SelicHistoryDTO> yearApi    = fetchSelic("4189", 1);
            Thread.sleep(1200);
            // Acumulado 12m a partir da série mensal 4390 (% a.m.), não da meta anual 432.
            List<SelicHistoryDTO> history = fetchSelic("4390", 12);

            // persiste cada ponto (idempotente)
            currentApi.forEach(h -> financialDataService.savePoint("432", SOURCE, h.date(), h.value(), null));
            history.forEach(h -> financialDataService.savePoint("4390", SOURCE, h.date(), h.value(), null));
            monthApi.forEach(h -> financialDataService.savePoint("1178", SOURCE, h.date(), h.value(), null));
            yearApi.forEach(h -> financialDataService.savePoint("4189", SOURCE, h.date(), h.value(), null));

            double last12Compound = (history.stream()
                    .mapToDouble(SelicHistoryDTO::value)
                    .reduce(1.0, (acc, v) -> acc * (1 + v / 100)) - 1) * 100;

            return new SelicDataDTO(
                    currentApi.getFirst().value(),
                    monthApi.getFirst().value(),
                    yearApi.getFirst().value(),
                    Math.round(last12Compound * 100.0) / 100.0
            );

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new BcbApiException("Requisição interrompida");

        } catch (Exception e) {
            e.printStackTrace();
            throw new BcbApiException("Erro ao buscar dados da Selic "+ e.getMessage());
        }
    }


    @Cacheable("bcb-ipca")
    @Override
    public IpcaDataDTO getIpca () {
        // DB-first: reconstrói o DTO a partir dos pontos salvos (séries 433/13522).
        // Acumulado e composição 12m recomputados a partir dos últimos 12 pontos mensais (série 433).
        Optional<FinancialDataPoint> currentMonthDb = financialDataService.getLastPoint("433", SOURCE);
        Optional<FinancialDataPoint> accumulatedYearDb = financialDataService.getLastPoint("13522", SOURCE);
        if (currentMonthDb.isPresent() && accumulatedYearDb.isPresent()) {
            List<FinancialDataPoint> history = financialDataService.getRecentPoints("433", SOURCE, 12);
            return new IpcaDataDTO(
                    currentMonthDb.get().getValue().doubleValue(),
                    accumulatedYearDb.get().getValue().doubleValue(),
                    sumPercent(history),
                    compoundPercent(history)
            );
        }
        return refreshIpca();
    }

    /**
     * Busca o IPCA na API e persiste, ignorando o atalho DB-first.
     * Usado pelo scheduler para re-alimentar o banco e como fallback de leitura.
     */
    public IpcaDataDTO refreshIpca() {
        try {
                List<IpcaHistoryDTO> currentMonth = fetchIpca("433", 1);
                List<IpcaHistoryDTO> accumulatedYear = fetchIpca("13522", 1);
                List<IpcaHistoryDTO> history = fetchIpca("433", 12);

                if (currentMonth.isEmpty() || accumulatedYear.isEmpty() || history.isEmpty()) {
                    throw new BcbApiException("Dados IPCA incompletos");
                }

                // persiste cada ponto (idempotente)
                history.forEach(h -> financialDataService.savePoint("433", SOURCE, h.date(), h.value(), null));
                accumulatedYear.forEach(h -> financialDataService.savePoint("13522", SOURCE, h.date(), h.value(), null));

                double last12Sum = Math.round(
                        history.stream().mapToDouble(IpcaHistoryDTO::value).sum() * 100.0
                ) / 100.0;


                // Composição - juros
                double last12Compound = Math.round(
                        (history.stream()
                                .mapToDouble(IpcaHistoryDTO::value)
                                .reduce(1.0, (acc, v) -> acc * (1 + v / 100)) - 1) * 100 * 100.0
                ) / 100.0;

                return new IpcaDataDTO(
                        currentMonth.getFirst().value(),
                        accumulatedYear.getFirst().value(),
                        last12Sum,
                        last12Compound
                );

        } catch (BcbApiException e) {
            throw e;
        } catch (Exception e) {
            throw new BcbApiException("Erro ao buscar IPCA: " + e.getMessage());
        }
    }


    // ptax
    @Cacheable("bcb-ptax")
    public DollarPtaxDTO getDollarPtax() {
        // DB-first: serve o último ponto salvo; só chama a API se o banco estiver vazio
        Optional<FinancialDataPoint> last = financialDataService.getLastPoint("1", SOURCE);
        if (last.isPresent()) {
            FinancialDataPoint p = last.get();
            return new DollarPtaxDTO(p.getReferenceDate().format(BCB_DATE), p.getValue().doubleValue());
        }
        return refreshDollarPtax();
    }

    /**
     * Busca a PTAX na API e persiste, ignorando o atalho DB-first.
     * Usado pelo scheduler para re-alimentar o banco e como fallback de leitura.
     */
    public DollarPtaxDTO refreshDollarPtax() {
        try {
            List<DollarPtaxDTO> data = restClient.get()
                    .uri("https://api.bcb.gov.br/dados/serie/bcdata.sgs.1/dados/ultimos/1?formato=json")
                    .retrieve()
                    .body(new ParameterizedTypeReference<List<DollarPtaxDTO>>() {});

            if (data == null || data.isEmpty()) {
                throw new BcbApiException("Dados do dólar PTAX indisponíveis");
            }

            DollarPtaxDTO ptax = data.getFirst();
            // persiste no banco
            financialDataService.savePoint("1", SOURCE, ptax.date(), ptax.value(), null);

            return ptax;

        } catch (BcbApiException e) {
            throw e;
        } catch (Exception e) {
            throw new BcbApiException("Erro ao buscar dólar PTAX");
        }
    }



    @Cacheable("bcb-cdi")
    @Override
    public CdiDataDTO getCdiRate() {
        // DB-first: serve o último ponto salvo; só chama a API se o banco estiver vazio
        Optional<FinancialDataPoint> last = financialDataService.getLastPoint("12", SOURCE);
        if (last.isPresent()) {
            FinancialDataPoint p = last.get();
            return new CdiDataDTO(
                    p.getReferenceDate().format(BCB_DATE),
                    p.getValue().doubleValue(),
                    p.getSecondaryValue() != null ? p.getSecondaryValue().doubleValue() : null
            );
        }
        return refreshCdiRate();
    }

    /**
     * Busca o CDI na API e persiste, ignorando o atalho DB-first.
     * Usado pelo scheduler para re-alimentar o banco e como fallback de leitura.
     */
    public CdiDataDTO refreshCdiRate() {
        try {
            List<Map<String, String>> data = restClient.get()
                    .uri("https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados/ultimos/1?formato=json")
                    .retrieve()
                    .body(new ParameterizedTypeReference<List<Map<String, String>>>() {});

            // Verificação dos dados retornados.
            if (data == null || data.isEmpty()) {
                throw new BcbApiException("Dados CDI indisponíveis");
            }
            Map<String, String> entry = data.get(0);
            if (entry == null || entry.get(DATA) == null || entry.get(VALOR) == null) {
                throw new BcbApiException("Dados CDI incompletos");
            }

            double daily  = Double.parseDouble(entry.get(VALOR));
            // BCB usa 252 dias úteis como convenção para anualização
            double annual = (Math.pow(1.0 + daily / 100.0, 252) - 1.0) * 100.0;

            // persiste no banco (idempotente — ignora se já existe)
            financialDataService.savePoint("12", SOURCE, entry.get(DATA), daily, annual);

            return new CdiDataDTO(entry.get(DATA), daily, annual);

        } catch (BcbApiException e) {
            throw e;
        } catch (Exception e) {
            throw new BcbApiException("Erro ao buscar taxa CDI: " + e.getMessage());
        }
    }


    // Últimos 12 meses a partir da data atual.
    @Cacheable("selic-history")
    @Override
    public List<SelicHistoryDTO> getSelicHistory () {
        // DB-first: serve os 12 pontos mais recentes da meta SELIC (série 4390) em ordem cronológica
        List<FinancialDataPoint> points = financialDataService.getRecentPoints("4390", SOURCE, 12);
        if (!points.isEmpty()) {
            return points.stream()
                    .map(p -> new SelicHistoryDTO(p.getReferenceDate().format(BCB_DATE), p.getValue().doubleValue()))
                    .toList();
        }
        return refreshSelicHistory();
    }

    /**
     * Busca o histórico SELIC na API e persiste, ignorando o atalho DB-first.
     * Usado pelo scheduler para re-alimentar o banco e como fallback de leitura.
     */
    public List<SelicHistoryDTO> refreshSelicHistory() {
        try {
            List<SelicHistoryDTO> data = fetchSelic("4390", 12);
            data.forEach(h -> financialDataService.savePoint("4390", SOURCE, h.date(), h.value(), null));
            return data;
        } catch (BcbApiException e) {
            throw e;
        } catch (Exception e) {
            throw new BcbApiException("Erro ao comunicar com a API do Banco Central: Histórico Selic " + e.getMessage());
        }
    }


    @Override
    public FinancialDataDTO getFinancialData () {
        try {
            return null;
        } catch (BcbApiException e) {
            throw e;
        } catch (Exception e) {
            throw new BcbApiException("Erro ao comunicar com a API do Banco Central: Dados financeiros");
        }
    }



    @Cacheable("salario-minimo")
    public List<MinimumWageDTO> getMinimumWageAll() {
        // DB-first: serve os pontos salvos (ordem cronológica); só chama a API se o banco estiver vazio
        List<FinancialDataPoint> points = financialDataService.getAllPoints("1619", SOURCE);
        if (!points.isEmpty()) {
            return points.stream()
                    .map(p -> new MinimumWageDTO(p.getReferenceDate().format(BCB_DATE), p.getValue().doubleValue()))
                    .toList();
        }
        return refreshMinimumWage();
    }

    /**
     * Busca o salário mínimo na API e persiste, ignorando o atalho DB-first.
     * Usado pelo scheduler para re-alimentar o banco e como fallback de leitura.
     */
    public List<MinimumWageDTO> refreshMinimumWage() {
        try {
            String url = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.1619/dados/ultimos/20?formato=json";
            List<MinimumWageDTO> data = restClient.get()
                    .uri(url)
                    .retrieve()
                    .body(new ParameterizedTypeReference<List<MinimumWageDTO>>() {
                    });
            if (data == null || data.isEmpty()){
                throw new BcbApiException("Dados de salário mínimo vigente vazios.");
            }
            // persiste cada ponto (idempotente)
            data.forEach(w -> financialDataService.savePoint(
                    "1619", SOURCE, w.data(), w.valor(), null));
            return data;
        } catch (BcbApiException e) {
            throw e;
        } catch (Exception e) {
            throw new BcbApiException("Erro no servidor - API Banco Central");
        }
    }


    @Override
    public List<MinimumWageDTO> getMinimumWage(int intervaloMeses) {
        // Verifica intervalo dos meses.
        bcbValidator.validIntervalFilterMonth(intervaloMeses);

        try {
            // cópia mutável: getMinimumWageAll() pode retornar lista imutável (DB-first)
            // e/ou cacheada — reverter no lugar quebraria ou corromperia o cache
            List<MinimumWageDTO> all = new ArrayList<>(getMinimumWageAll());
            Collections.reverse(all);
            return all.stream()
                    .limit(intervaloMeses)
                    .toList();

        } catch (BcbApiException e) {
            throw e;
        } catch (Exception e) {
            throw new BcbApiException("Erro no servidor - API Banco Central.");
        }

    }


    // ── Agregados reconstruídos a partir dos pontos do banco ───────────────

    /** Composição (juros sobre juros) de uma lista de pontos %, arredondada a 2 casas. */
    private double compoundPercent(List<FinancialDataPoint> points) {
        double compound = (points.stream()
                .mapToDouble(p -> p.getValue().doubleValue())
                .reduce(1.0, (acc, v) -> acc * (1 + v / 100)) - 1) * 100;
        return Math.round(compound * 100.0) / 100.0;
    }

    /** Soma simples de uma lista de pontos %, arredondada a 2 casas. */
    private double sumPercent(List<FinancialDataPoint> points) {
        return Math.round(
                points.stream().mapToDouble(p -> p.getValue().doubleValue()).sum() * 100.0
        ) / 100.0;
    }

    // Auxiliam chamada na API e filtro
    private List<SelicHistoryDTO> fetchSelic(String codigo, int quantidade) {
        try {
            List<SelicHistoryDTO> data = restClient.get()
                    .uri("https://api.bcb.gov.br/dados/serie/bcdata.sgs.{codigo}/dados/ultimos/{quantidade}?formato=json", codigo, quantidade)
                    .retrieve()
                    .body(new ParameterizedTypeReference<List<SelicHistoryDTO>>() {});

            if (data == null || data.isEmpty()) {
                throw new BcbApiException("Dados Selic indisponíveis");
            }
            return data;

        } catch (BcbApiException e) {
            throw e;
        } catch (Exception e) {
            throw new BcbApiException("Erro ao buscar Selic: " + e.getMessage());
        }
    }

    private List<IpcaHistoryDTO> fetchIpca(String codigo, int quantidade) {
        try {
            List<IpcaHistoryDTO> data = restClient.get()
                    .uri("https://api.bcb.gov.br/dados/serie/bcdata.sgs.{codigo}/dados/ultimos/{quantidade}?formato=json", codigo, quantidade)
                    .retrieve()
                    .body(new ParameterizedTypeReference<List<IpcaHistoryDTO>>() {});

            if (data == null || data.isEmpty()) {
                throw new BcbApiException("Dados IPCA indisponíveis");
            }
            return data;

        } catch (BcbApiException e) {
            throw e;
        } catch (Exception e) {
            throw new BcbApiException("Erro ao buscar IPCA: " + e.getMessage());
        }
    }

}

