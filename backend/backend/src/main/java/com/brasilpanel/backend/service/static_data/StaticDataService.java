package com.brasilpanel.backend.service.static_data;

import com.brasilpanel.backend.dto.api.brasilAPI.BankDTO;
import com.brasilpanel.backend.dto.api.ibge.EstadoDTO;
import com.brasilpanel.backend.dto.api.ibge.EstadoRankingDTO;
import com.brasilpanel.backend.dto.api.ibge.MunicipioDTO;
import com.brasilpanel.backend.dto.api.ibge.RegiaoDTO;
import com.brasilpanel.backend.exception.customized.IbgeException;
import com.brasilpanel.backend.model.Bank;
import com.brasilpanel.backend.model.IbgeCity;
import com.brasilpanel.backend.model.IbgeState;
import com.brasilpanel.backend.repository.static_data.BankRepository;
import com.brasilpanel.backend.repository.static_data.IbgeCityRepository;
import com.brasilpanel.backend.repository.static_data.IbgeStateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Serve dados estáticos (bancos, estados, municípios) priorizando o banco local.
 * Municípios são carregados da API IBGE na primeira consulta por estado (lazy seeding).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class StaticDataService {

    private final BankRepository bankRepository;
    private final IbgeStateRepository stateRepository;
    private final IbgeCityRepository cityRepository;
    private final RestClient restClient;

    // ── Bancos ─────────────────────────────────────────────────────────────

    /** Lista todos os bancos ordenados por código */
    @Cacheable("banks")
    @Transactional(readOnly = true)
    public List<BankDTO> getAllBanks() {
        return bankRepository.findAllByOrderByCodeAsc().stream()
                .map(this::toDTO)
                .toList();
    }

    /** Busca banco por código */
    @Cacheable(value = "bank-by-code", key = "#code")
    @Transactional(readOnly = true)
    public Optional<BankDTO> getBankByCode(int code) {
        return bankRepository.findByCode(code).map(this::toDTO);
    }

    // ── Estados ────────────────────────────────────────────────────────────

    /** Lista todos os estados ordenados por nome */
    @Cacheable("ibge-states")
    @Transactional(readOnly = true)
    public List<EstadoDTO> getAllStates() {
        return stateRepository.findAllByOrderByNomeAsc().stream()
                .map(this::toDTO)
                .toList();
    }

    /**
     * Ranking de estados por nº de municípios, do maior para o menor.
     * DB-first: se todos os estados já foram semeados, conta no banco; senão busca
     * a lista nivelada do IBGE (1 requisição) e agrupa por UF.
     */
    @Cacheable("ibge-states-ranking")
    @Transactional(readOnly = true)
    public List<EstadoRankingDTO> getStatesRanking() {
        List<Object[]> grouped = cityRepository.countGroupedByState();

        List<EstadoRankingDTO> ranking = (grouped.size() == stateRepository.count())
                ? grouped.stream()
                        .map(r -> new EstadoRankingDTO((String) r[0], (String) r[1], (Long) r[2]))
                        .collect(java.util.stream.Collectors.toList())
                : fetchRankingFromApi();

        ranking.sort(Comparator.comparingLong(EstadoRankingDTO::totalMunicipios).reversed());
        return ranking;
    }

    /** Busca todos os municípios nivelados do IBGE (1 requisição) e conta por UF. */
    private List<EstadoRankingDTO> fetchRankingFromApi() {
        try {
            List<Map<String, Object>> data = restClient.get()
                    .uri("https://servicodados.ibge.gov.br/api/v1/localidades/municipios?view=nivelado")
                    .retrieve()
                    .body(new ParameterizedTypeReference<List<Map<String, Object>>>() {});

            if (data == null || data.isEmpty()) {
                throw new IbgeException("IBGE retornou lista de municípios vazia", 502);
            }

            Map<String, long[]> porUf = new java.util.HashMap<>();
            Map<String, String> nomeUf = new java.util.HashMap<>();
            for (Map<String, Object> m : data) {
                String sigla = (String) m.get("UF-sigla");
                if (sigla == null) continue;
                nomeUf.putIfAbsent(sigla, (String) m.get("UF-nome"));
                porUf.computeIfAbsent(sigla, k -> new long[1])[0]++;
            }

            return porUf.entrySet().stream()
                    .map(e -> new EstadoRankingDTO(e.getKey(), nomeUf.get(e.getKey()), e.getValue()[0]))
                    .collect(java.util.stream.Collectors.toList());

        } catch (IbgeException e) {
            throw e;
        } catch (Exception e) {
            throw new IbgeException("Erro ao buscar ranking de municípios: " + e.getMessage(), 502);
        }
    }

    // ── Municípios — lazy seeding ──────────────────────────────────────────

    /**
     * Retorna municípios de um estado, identificado por ID (ex: "35") ou sigla (ex: "SP").
     * Se não existirem no banco, busca na API do IBGE e persiste (lazy seeding).
     *
     * @param state  ID ou sigla do estado — ex: "SP", "35"
     * @param filtro filtro opcional por nome
     */
    @Cacheable(value = "ibge-cities", key = "#state.toUpperCase() + '|' + (#filtro == null ? '' : #filtro.trim().toLowerCase())")
    @Transactional
    public List<MunicipioDTO> getCitiesByState(String state, String filtro) {
        IbgeState resolved = resolveState(state);

        // Lazy seeding: carrega da API se ainda não tem no banco
        if (!cityRepository.existsByState(resolved)) {
            loadCitiesFromApi(resolved);
        }

        List<IbgeCity> cities = (filtro != null && !filtro.isBlank())
                ? cityRepository.findByStateAndNomeContainingIgnoreCaseOrderByNomeAsc(resolved, filtro.trim())
                : cityRepository.findByStateOrderByNomeAsc(resolved);

        return cities.stream()
                .map(c -> new MunicipioDTO(c.getId(), c.getNome()))
                .toList();
    }

    /** Resolve um estado por ID numérico ou sigla. Lança 400 se não existir no banco. */
    private IbgeState resolveState(String state) {
        String raw = state.trim();
        Optional<IbgeState> found;
        try {
            found = stateRepository.findById(Integer.parseInt(raw));
        } catch (NumberFormatException e) {
            found = stateRepository.findBySiglaIgnoreCase(raw);
        }
        return found.orElseThrow(() -> new IbgeException("Estado inválido: " + state, 400));
    }

    // ── Conversores ────────────────────────────────────────────────────────

    private BankDTO toDTO(Bank b) {
        return new BankDTO(b.getIspb(), b.getName(), b.getCode(), b.getFullName());
    }

    private EstadoDTO toDTO(IbgeState s) {
        return new EstadoDTO(
                s.getId(), s.getSigla(), s.getNome(),
                new RegiaoDTO(s.getRegiaoId(), s.getRegiaoSigla(), s.getRegiaoNome())
        );
    }

    // ── Lazy loader de cidades ─────────────────────────────────────────────

    private void loadCitiesFromApi(IbgeState state) {
        try {
            String url = "https://servicodados.ibge.gov.br/api/v1/localidades/estados/"
                    + state.getSigla() + "/municipios";

            List<MunicipioDTO> data = restClient.get()
                    .uri(url)
                    .retrieve()
                    .body(new ParameterizedTypeReference<List<MunicipioDTO>>() {});

            if (data == null || data.isEmpty()) {
                log.warn("StaticDataService: IBGE retornou lista vazia de municípios para {}", state.getSigla());
                return;
            }

            List<IbgeCity> cities = data.stream()
                    .map(m -> IbgeCity.builder()
                            .id(m.id())
                            .nome(m.nome())
                            .state(state)
                            .build())
                    .toList();

            cityRepository.saveAll(cities);
            log.info("StaticDataService: {} municípios de {} carregados.", cities.size(), state.getSigla());

        } catch (Exception e) {
            log.warn("StaticDataService: falha ao carregar municípios de {} — {}", state.getSigla(), e.getMessage());
        }
    }
}
