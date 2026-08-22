package com.brasilpanel.backend.service.api.viaCep;

import com.brasilpanel.backend.dto.api.viaCep.EnderecoCepDTO;
import com.brasilpanel.backend.dto.api.viaCep.ViaCepRawDTO;
import com.brasilpanel.backend.exception.customized.ViaCepException;
import com.brasilpanel.backend.exception.customized.ViaCepNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;
import java.util.function.Supplier;

@Service
@Slf4j
@RequiredArgsConstructor
public class ViaCepService {

    private static final String BY_CEP_URL = "https://viacep.com.br/ws/{cep}/json/";
    private static final String SEARCH_URL = "https://viacep.com.br/ws/{uf}/{cidade}/{logradouro}/json/";

    /** Exigência do próprio ViaCEP na busca por logradouro. */
    private static final int MIN_TERM_LENGTH = 3;

    private final RestClient restClient;

    // ── CEP → endereço ───────────────────────────────────────────────────────

    /**
     * CEP → endereço é praticamente imutável (os CORREIOS atualizam raramente).
     * Chave normalizada (apenas dígitos) evita duplicatas: "01310-100" = "01310100".
     */
    @Cacheable(value = "viacep", key = "#cep.replaceAll('[^0-9]', '')")
    public EnderecoCepDTO getAddressByCep(String cep) {
        String cleanCep = cep.replaceAll("\\D", "");

        if (cleanCep.length() != 8) {
            throw new IllegalArgumentException("CEP deve ter 8 dígitos");
        }

        ViaCepRawDTO raw = get(BY_CEP_URL, ViaCepRawDTO.class, cleanCep);

        if (raw == null) {
            throw new ViaCepException("ViaCEP devolveu resposta vazia para o CEP " + cleanCep);
        }
        // O ViaCEP responde 200 com {"erro": "true"} para CEP inexistente. Sem
        // este teste o record vem com todos os campos nulos e o cliente recebe
        // um 200 com endereço em branco, sem forma de detectar a falha.
        if (raw.notFound()) {
            throw new ViaCepNotFoundException("CEP não encontrado: " + cleanCep);
        }

        return EnderecoCepDTO.from(raw);
    }

    // ── Busca reversa: UF + município + logradouro → lista de CEPs ────────────

    /**
     * Busca endereços por logradouro dentro de um município. O ViaCEP devolve no
     * máximo 50 resultados, e lista vazia quando não encontra nada — aqui o vazio
     * é repassado como está, porque "nenhuma rua com esse nome" é um resultado
     * legítimo, não um erro.
     *
     * @param uf         sigla do estado — ex: "SP"
     * @param cidade     nome do município — ex: "São Paulo"
     * @param logradouro trecho do nome da rua — ex: "Paulista"
     */
    @Cacheable(value = "viacep-busca",
            key = "#uf.toUpperCase() + '|' + #cidade.trim().toLowerCase() + '|' + #logradouro.trim().toLowerCase()")
    public List<EnderecoCepDTO> searchAddresses(String uf, String cidade, String logradouro) {
        requireMinLength(cidade, "cidade");
        requireMinLength(logradouro, "logradouro");

        List<ViaCepRawDTO> raw = get(
                SEARCH_URL,
                new ParameterizedTypeReference<List<ViaCepRawDTO>>() {},
                uf.trim().toUpperCase(), cidade.trim(), logradouro.trim());

        if (raw == null) {
            throw new ViaCepException("ViaCEP devolveu resposta vazia para a busca em " + cidade + "/" + uf);
        }

        return raw.stream()
                .filter(r -> !r.notFound())
                .map(EnderecoCepDTO::from)
                .toList();
    }

    // ── Infraestrutura ───────────────────────────────────────────────────────

    private <T> T get(String url, Class<T> type, Object... uriVariables) {
        return execute(() -> restClient.get().uri(url, uriVariables).retrieve().body(type));
    }

    private <T> T get(String url, ParameterizedTypeReference<T> type, Object... uriVariables) {
        return execute(() -> restClient.get().uri(url, uriVariables).retrieve().body(type));
    }

    /**
     * Converte qualquer falha de transporte ou de desserialização em
     * {@link ViaCepException}, que o handler global mapeia para 502. Sem isto um
     * 5xx do ViaCEP subia como {@code HttpServerErrorException} e virava um 500
     * genérico — contradizendo o 502 documentado no controller.
     */
    private <T> T execute(Supplier<T> call) {
        try {
            return call.get();
        } catch (RestClientException e) {
            // O detalhe fica no log do servidor; o cliente recebe mensagem genérica:
            // e.getMessage() de uma falha de transporte traz a URL da fonte, e de um
            // 5xx traz o corpo de erro dela.
            log.error("Falha na comunicação com o ViaCEP", e);
            throw new ViaCepException("Não foi possível consultar o ViaCEP.");
        }
    }

    private void requireMinLength(String value, String field) {
        if (value == null || value.trim().length() < MIN_TERM_LENGTH) {
            throw new IllegalArgumentException(
                    "O campo '" + field + "' precisa de no mínimo " + MIN_TERM_LENGTH + " caracteres");
        }
    }
}