package com.brasilpanel.backend.service.api.ipea;


import com.brasilpanel.backend.dto.api.ipea.IpeaItemDTO;
import com.brasilpanel.backend.dto.api.ipea.IpeaResponseDTO;
import com.brasilpanel.backend.dto.api.ipea.IpeaSerieDTO;
import com.brasilpanel.backend.exception.customized.IpeaException;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class IpeaService {
    private final RestClient restClient;
    private static final String BASE_URL =
            "http://ipeadata.gov.br/api/odata4/Metadados('{codigo}')/Valores";

    // Emprego
    private static final String DESOCUPACAO = "PNADC12_NDESOCM12";
    private static final String OCUPACAO = "PNADC12_NOCUP12";

    // Renda
    private static final String SALARIO_MINIMO_REAL = "GAC12_SALMINRE12";
    private static final String SALARIO_MINIMO_PPC = "GAC12_SALMINDOL12";
    private static final String RENDA_PER_CAPITA = "PNADS_RENDAMEDIA";

    // Desigualdade
    private static final String GINI = "PNADS_GINI";
    private static final String POBREZA = "PNADS_PERCPOBRE300";

    // Macro
    private static final String PIB = "WEO_PIBWEOBRA";
    private static final String INVESTIMENTO = "WEO_INVESTWEOBRA";
    private static final String DESEMPREGO_FMI = "WEO_DESEMWEOBRA";
    private static final String SELIC = "PAN12_TJOVER12";
    private static final String RESERVAS = "BM12_RES12";
    private static final String ARRECADACAO = "SRF12_TOTGER12";

    // Preços
    private static final String INPC = "PRECOS12_INPC12";
    private static final String IGPM = "IGP12_IGPM12";

    // População
    private static final String POPULACAO = "PNADC12_POP12";
    private static final String PROJECAO_TOTAL = "DEPIS_POPP";
    private static final String PROJECAO_HOMENS = "DEPIS_POPHP";
    private static final String PROJECAO_MULHERES = "DEPIS_POPMP";


    // Requisição feita à API baseada no código.
    // As requisições abaixo reutilizam essa função, só o código de série muda.
    private List<IpeaItemDTO> fetchSerie(String codigo) {
        try {
            String url = BASE_URL.replace("{codigo}", codigo);
            IpeaResponseDTO response = restClient.get()
                    .uri(url)
                    .retrieve()
                    .body(IpeaResponseDTO.class);

            if (response == null || response.value() == null) {
                throw new IpeaException("Série não encontrada: " + codigo, 404);
            }

            return response.value().stream()
                    .sorted(Comparator.comparing(IpeaItemDTO::data).reversed())
                    .toList();

        } catch (IpeaException e) {
            throw e;
        } catch (Exception e) {
            throw new IpeaException("Erro ao buscar série: " + codigo, 502);
        }
    }


    @Cacheable("ipea-emprego")
    public List<IpeaSerieDTO> getEmprego() {
        return List.of(
                new IpeaSerieDTO(DESOCUPACAO, "Taxa de desocupação (%)", fetchSerie(DESOCUPACAO)),
                new IpeaSerieDTO(OCUPACAO, "Nível de ocupação (%)", fetchSerie(OCUPACAO))
        );
    }


    @Cacheable("ipea-renda")
    public List<IpeaSerieDTO> getRenda() {
        return List.of(
                new IpeaSerieDTO(SALARIO_MINIMO_REAL, "Salário mínimo real (R$)", fetchSerie(SALARIO_MINIMO_REAL)),
                new IpeaSerieDTO(SALARIO_MINIMO_PPC, "Salário mínimo PPC (USD)", fetchSerie(SALARIO_MINIMO_PPC)),
                new IpeaSerieDTO(RENDA_PER_CAPITA, "Renda domiciliar per capita (R$)", fetchSerie(RENDA_PER_CAPITA))
        );
    }


    @Cacheable("ipea-desigualdade")
    public List<IpeaSerieDTO> getDesigualdade() {
        return List.of(
                new IpeaSerieDTO(GINI, "Coeficiente de Gini", fetchSerie(GINI)),
                new IpeaSerieDTO(POBREZA, "Taxa de pobreza % (PPC$3/dia)", fetchSerie(POBREZA))
        );
    }


    @Cacheable("ipea-macro")
    public List<IpeaSerieDTO> getMacro() {
        return List.of(
                new IpeaSerieDTO(PIB, "PIB (US$ bilhões)", fetchSerie(PIB)),
                new IpeaSerieDTO(INVESTIMENTO, "Investimento (% PIB)", fetchSerie(INVESTIMENTO)),
                new IpeaSerieDTO(DESEMPREGO_FMI, "Taxa de desemprego FMI (%)", fetchSerie(DESEMPREGO_FMI)),
                new IpeaSerieDTO(SELIC, "Taxa Selic/Overnight (% a.a.)", fetchSerie(SELIC)),
                new IpeaSerieDTO(RESERVAS, "Reservas internacionais (US$ milhões)", fetchSerie(RESERVAS)),
                new IpeaSerieDTO(ARRECADACAO, "Arrecadação federal (R$ milhões)", fetchSerie(ARRECADACAO))
        );
    }


    @Cacheable("ipea-precos")
    public List<IpeaSerieDTO> getPrecos() {
        return List.of(
                new IpeaSerieDTO(INPC, "INPC - índice", fetchSerie(INPC)),
                new IpeaSerieDTO(IGPM, "IGP-M - índice", fetchSerie(IGPM))
        );
    }


    @Cacheable("ipea-populacao")
    public List<IpeaSerieDTO> getPopulacao() {
        return List.of(
                new IpeaSerieDTO(POPULACAO, "População total (mil pessoas)", fetchSerie(POPULACAO)),
                new IpeaSerieDTO(PROJECAO_TOTAL, "Projeção população total", fetchSerie(PROJECAO_TOTAL)),
                new IpeaSerieDTO(PROJECAO_HOMENS, "Projeção população homens", fetchSerie(PROJECAO_HOMENS)),
                new IpeaSerieDTO(PROJECAO_MULHERES, "Projeção população mulheres", fetchSerie(PROJECAO_MULHERES))
        );
    }

}
