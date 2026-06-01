package com.brasilpanel.backend.service.static_data;

import com.brasilpanel.backend.dto.api.brasilAPI.BankDTO;
import com.brasilpanel.backend.dto.api.ibge.EstadoDTO;
import com.brasilpanel.backend.dto.api.ibge.MunicipioDTO;
import com.brasilpanel.backend.dto.api.ibge.RegiaoDTO;
import com.brasilpanel.backend.model.Bank;
import com.brasilpanel.backend.model.IbgeCity;
import com.brasilpanel.backend.model.IbgeState;
import com.brasilpanel.backend.repository.static_data.BankRepository;
import com.brasilpanel.backend.repository.static_data.IbgeCityRepository;
import com.brasilpanel.backend.repository.static_data.IbgeStateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.util.List;
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
    @Transactional(readOnly = true)
    public List<BankDTO> getAllBanks() {
        return bankRepository.findAllByOrderByCodeAsc().stream()
                .map(this::toDTO)
                .toList();
    }

    /** Busca banco por código */
    @Transactional(readOnly = true)
    public Optional<BankDTO> getBankByCode(int code) {
        return bankRepository.findByCode(code).map(this::toDTO);
    }

    // ── Estados ────────────────────────────────────────────────────────────

    /** Lista todos os estados ordenados por nome */
    @Transactional(readOnly = true)
    public List<EstadoDTO> getAllStates() {
        return stateRepository.findAllByOrderByNomeAsc().stream()
                .map(this::toDTO)
                .toList();
    }

    // ── Municípios — lazy seeding ──────────────────────────────────────────

    /**
     * Retorna municípios de um estado.
     * Se não existirem no banco, busca na API do IBGE e persiste (lazy seeding).
     *
     * @param sigla sigla do estado — ex: "SP", "RJ"
     * @param filtro filtro opcional por nome
     */
    @Transactional
    public List<MunicipioDTO> getCitiesByState(String sigla, String filtro) {
        IbgeState state = stateRepository.findBySiglaIgnoreCase(sigla)
                .orElseThrow(() -> new IllegalArgumentException("Estado não encontrado: " + sigla));

        // Lazy seeding: carrega da API se ainda não tem no banco
        if (!cityRepository.existsByState(state)) {
            loadCitiesFromApi(state);
        }

        List<IbgeCity> cities = (filtro != null && !filtro.isBlank())
                ? cityRepository.findByStateAndNomeContainingIgnoreCaseOrderByNomeAsc(state, filtro.trim())
                : cityRepository.findByStateOrderByNomeAsc(state);

        return cities.stream()
                .map(c -> new MunicipioDTO(c.getId(), c.getNome()))
                .toList();
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
