package com.brasilpanel.backend.service.profile;

import com.brasilpanel.backend.dto.profile.ProfileOptionsDTO;
import com.brasilpanel.backend.dto.profile.ProfileResponseDTO;
import com.brasilpanel.backend.dto.profile.UpdateProfileRequestDTO;
import com.brasilpanel.backend.model.*;
import com.brasilpanel.backend.repository.profile.*;
import com.brasilpanel.backend.repository.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Regras do perfil profissional/acadêmico.
 *
 * <p>O catálogo (áreas, subáreas, níveis) é dado de referência e cabe em
 * memória — as consultas de opções fazem poucos SELECTs e montam a árvore em
 * Java, sem relações JPA preguiçosas.
 */
@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository userRepository;
    private final UserProfileRepository profileRepository;
    private final KnowledgeAreaRepository areaRepository;
    private final KnowledgeSubareaRepository subareaRepository;
    private final EducationLevelRepository educationLevelRepository;
    private final ProfessionLevelRepository professionLevelRepository;


    // ── Catálogo de opções ──────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ProfileOptionsDTO getOptions() {
        Map<Long, List<ProfileOptionsDTO.SubareaOption>> subByArea =
                subareaRepository.findAllByOrderByAreaIdAscSortOrderAscNameAsc().stream()
                        .collect(Collectors.groupingBy(
                                KnowledgeSubarea::getAreaId,
                                Collectors.mapping(
                                        s -> new ProfileOptionsDTO.SubareaOption(s.getId(), s.getSlug(), s.getName()),
                                        Collectors.toList())));

        List<ProfileOptionsDTO.AreaOption> areas =
                areaRepository.findAllByOrderBySortOrderAscNameAsc().stream()
                        .map(a -> new ProfileOptionsDTO.AreaOption(
                                a.getId(), a.getSlug(), a.getName(),
                                subByArea.getOrDefault(a.getId(), List.of())))
                        .toList();

        List<ProfileOptionsDTO.LevelOption> educationLevels =
                educationLevelRepository.findAllByOrderByRankAsc().stream()
                        .map(l -> new ProfileOptionsDTO.LevelOption(l.getId(), l.getSlug(), l.getName()))
                        .toList();

        List<ProfileOptionsDTO.LevelOption> professionLevels =
                professionLevelRepository.findAllByOrderByRankAsc().stream()
                        .map(l -> new ProfileOptionsDTO.LevelOption(l.getId(), l.getSlug(), l.getName()))
                        .toList();

        return new ProfileOptionsDTO(areas, educationLevels, professionLevels);
    }


    // ── Leitura do perfil ─────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ProfileResponseDTO getProfile(String email) {
        UserEntity user = requireUser(email);
        return profileRepository.findByUserId(user.getId())
                .map(this::toResponse)
                .orElseGet(this::emptyResponse);
    }


    // ── Gravação (upsert) ──────────────────────────────────────────────────────

    @Transactional
    public ProfileResponseDTO updateProfile(String email, UpdateProfileRequestDTO dto) {
        UserEntity user = requireUser(email);

        // Resolve áreas primeiro; a subárea, quando informada, fixa/valida a área.
        ResolvedBranch profession = resolveBranch(
                dto.professionAreaId(), dto.professionSubareaId(), "profissão");
        ResolvedBranch education = resolveBranch(
                dto.educationAreaId(), dto.educationSubareaId(), "educação");

        Long professionLevelId = requireLevel(dto.professionLevelId(),
                professionLevelRepository::existsById, "nível de profissão");
        Long educationLevelId = requireLevel(dto.educationLevelId(),
                educationLevelRepository::existsById, "nível de educação");

        UserProfile profile = profileRepository.findByUserId(user.getId())
                .orElseGet(() -> UserProfile.builder().userId(user.getId()).build());

        profile.setProfessionAreaId(profession.areaId());
        profile.setProfessionSubareaId(profession.subareaId());
        profile.setProfessionLevelId(professionLevelId);
        profile.setProfessionTitle(trimToNull(dto.professionTitle()));

        profile.setEducationAreaId(education.areaId());
        profile.setEducationSubareaId(education.subareaId());
        profile.setEducationLevelId(educationLevelId);
        profile.setInstitution(trimToNull(dto.institution()));

        return toResponse(profileRepository.save(profile));
    }


    // ── Resolução / validação ──────────────────────────────────────────────────

    /** Área e subárea coerentes: subárea precisa existir e pertencer à área informada. */
    private ResolvedBranch resolveBranch(Long areaId, Long subareaId, String contexto) {
        if (subareaId == null) {
            if (areaId != null && !areaRepository.existsById(areaId)) {
                throw new IllegalArgumentException("Área de " + contexto + " inválida.");
            }
            return new ResolvedBranch(areaId, null);
        }

        KnowledgeSubarea subarea = subareaRepository.findById(subareaId)
                .orElseThrow(() -> new IllegalArgumentException("Subárea de " + contexto + " inválida."));

        // Se a área também veio, precisa bater; senão, deriva da subárea.
        if (areaId != null && !areaId.equals(subarea.getAreaId())) {
            throw new IllegalArgumentException("A subárea de " + contexto + " não pertence à área escolhida.");
        }
        return new ResolvedBranch(subarea.getAreaId(), subarea.getId());
    }

    private Long requireLevel(Long id, Function<Long, Boolean> exists, String contexto) {
        if (id == null) return null;
        if (!exists.apply(id)) {
            throw new IllegalArgumentException("Valor inválido para " + contexto + ".");
        }
        return id;
    }

    private record ResolvedBranch(Long areaId, Long subareaId) {}


    // ── Montagem da resposta ────────────────────────────────────────────────────

    private ProfileResponseDTO toResponse(UserProfile p) {
        Map<Long, KnowledgeArea> areas = indexById(areaRepository.findAll(), KnowledgeArea::getId);
        Map<Long, KnowledgeSubarea> subareas = indexById(subareaRepository.findAll(), KnowledgeSubarea::getId);
        Map<Long, EducationLevel> eduLevels = indexById(educationLevelRepository.findAll(), EducationLevel::getId);
        Map<Long, ProfessionLevel> profLevels = indexById(professionLevelRepository.findAll(), ProfessionLevel::getId);

        return new ProfileResponseDTO(
                areaRef(areas.get(p.getProfessionAreaId())),
                subareaRef(subareas.get(p.getProfessionSubareaId())),
                profLevelRef(profLevels.get(p.getProfessionLevelId())),
                p.getProfessionTitle(),
                areaRef(areas.get(p.getEducationAreaId())),
                subareaRef(subareas.get(p.getEducationSubareaId())),
                eduLevelRef(eduLevels.get(p.getEducationLevelId())),
                p.getInstitution(),
                p.getUpdatedAt()
        );
    }

    private ProfileResponseDTO emptyResponse() {
        return new ProfileResponseDTO(null, null, null, null, null, null, null, null, null);
    }

    private ProfileResponseDTO.Ref areaRef(KnowledgeArea a) {
        return a == null ? null : new ProfileResponseDTO.Ref(a.getId(), a.getSlug(), a.getName());
    }

    private ProfileResponseDTO.Ref subareaRef(KnowledgeSubarea s) {
        return s == null ? null : new ProfileResponseDTO.Ref(s.getId(), s.getSlug(), s.getName());
    }

    private ProfileResponseDTO.Ref eduLevelRef(EducationLevel l) {
        return l == null ? null : new ProfileResponseDTO.Ref(l.getId(), l.getSlug(), l.getName());
    }

    private ProfileResponseDTO.Ref profLevelRef(ProfessionLevel l) {
        return l == null ? null : new ProfileResponseDTO.Ref(l.getId(), l.getSlug(), l.getName());
    }


    // ── Helpers ─────────────────────────────────────────────────────────────────

    private <T> Map<Long, T> indexById(List<T> items, Function<T, Long> idFn) {
        return items.stream().collect(Collectors.toMap(idFn, Function.identity()));
    }

    private UserEntity requireUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado"));
    }

    private String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
