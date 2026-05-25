package com.brasilpanel.backend.service.api.bcb;

import com.brasilpanel.backend.dto.api.bcb.*;
import com.brasilpanel.backend.exception.customized.BcbApiException;
import com.brasilpanel.backend.validators.api.BcbValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Collections;
import java.util.List;
import java.util.Map;




@RequiredArgsConstructor
@Service
public class BcbService implements BcbImplementations{
    private final RestClient restClient;
    private static final String VALOR = "valor";
    private static final String DATA = "data";
    private final BcbValidator bcbValidator;



    @Cacheable("selic")
    public SelicDataDTO getSelic() {
        try {
            List<SelicHistoryDTO> current = fetchSelic("432", 1);
            Thread.sleep(1200);
            List<SelicHistoryDTO> month   = fetchSelic("1178", 1);
            Thread.sleep(1200);
            List<SelicHistoryDTO> year    = fetchSelic("4189", 1);
            Thread.sleep(1200);
            List<SelicHistoryDTO> history = fetchSelic("432", 12);

            double last12Compound = (history.stream()
                    .mapToDouble(SelicHistoryDTO::value)
                    .reduce(1.0, (acc, v) -> acc * (1 + v / 100)) - 1) * 100;

            return new SelicDataDTO(
                    current.getFirst().value(),
                    month.getFirst().value(),
                    year.getFirst().value(),
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


    @Override
    public IpcaDataDTO getIpca () {
        try {
                List<IpcaHistoryDTO> currentMonth = fetchIpca("433", 1);
                List<IpcaHistoryDTO> accumulatedYear = fetchIpca("13522", 1);
                List<IpcaHistoryDTO> history = fetchIpca("433", 12);

                if (currentMonth.isEmpty() || accumulatedYear.isEmpty() || history.isEmpty()) {
                    throw new BcbApiException("Dados IPCA incompletos");
                }

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
    public DollarPtaxDTO getDollarPtax() {
        try {
            List<DollarPtaxDTO> data = restClient.get()
                    .uri("https://api.bcb.gov.br/dados/serie/bcdata.sgs.1/dados/ultimos/1?formato=json")
                    .retrieve()
                    .body(new ParameterizedTypeReference<List<DollarPtaxDTO>>() {});

            if (data == null || data.isEmpty()) {
                throw new BcbApiException("Dados do dólar PTAX indisponíveis");
            }

            return data.getFirst();

        } catch (BcbApiException e) {
            throw e;
        } catch (Exception e) {
            throw new BcbApiException("Erro ao buscar dólar PTAX");
        }
    }



    @Override
    public CdiDataDTO getCdiRate() {
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

            return new CdiDataDTO(
                    entry.get(DATA),
                    Double.parseDouble(entry.get(VALOR))
            );

        } catch (BcbApiException e) {
            throw e;
        } catch (Exception e) {
            throw new BcbApiException("Erro ao buscar taxa CDI: " + e.getMessage());
        }
    }


    // Últimos 12 meses a partir da data atual.
    @Override
    public List<SelicHistoryDTO> getSelicHistory () {
        try {
            return fetchSelic("4390", 12);
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
            List<MinimumWageDTO> all = getMinimumWageAll();
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

