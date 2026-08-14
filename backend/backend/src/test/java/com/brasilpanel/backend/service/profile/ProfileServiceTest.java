package com.brasilpanel.backend.service.profile;

import com.brasilpanel.backend.dto.profile.UpdateProfileRequestDTO;
import com.brasilpanel.backend.model.*;
import com.brasilpanel.backend.repository.profile.*;
import com.brasilpanel.backend.repository.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * O catálogo é dado de referência com integridade garantida por FK, mas a
 * <em>coerência</em> entre os campos não é: nada no banco impede gravar uma
 * subárea de Tecnologia sob a área de Saúde, porque as duas colunas são FKs
 * independentes. Quem sustenta essa regra é o {@code resolveBranch}, e é o que
 * estes testes protegem.
 */
@ExtendWith(MockitoExtension.class)
class ProfileServiceTest {

    private static final String EMAIL = "usuario@exemplo.com";

    private static final long AREA_TECNOLOGIA = 1L;
    private static final long AREA_SAUDE      = 2L;
    private static final long SUB_BACKEND     = 10L;   // pertence a Tecnologia
    private static final long NIVEL_PLENO     = 100L;
    private static final long NIVEL_SUPERIOR  = 200L;

    @Mock private UserRepository            userRepository;
    @Mock private UserProfileRepository     profileRepository;
    @Mock private KnowledgeAreaRepository   areaRepository;
    @Mock private KnowledgeSubareaRepository subareaRepository;
    @Mock private EducationLevelRepository  educationLevelRepository;
    @Mock private ProfessionLevelRepository professionLevelRepository;

    @InjectMocks
    private ProfileService profileService;

    private UserEntity usuario;
    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        usuario = UserEntity.builder()
                .id(userId)
                .name("Usuário Teste")
                .email(EMAIL)
                .password("hash-bcrypt")
                .role(Role.USER)
                .verified(true)
                .build();
    }

    private void usuarioExiste() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(usuario));
    }

    /**
     * A montagem da resposta relê os quatro catálogos. Devolver listas vazias
     * basta para os testes que só verificam o que foi gravado — as referências
     * saem nulas, e o alvo é a entidade persistida, não o DTO.
     */
    private void catalogoVazio() {
        when(areaRepository.findAll()).thenReturn(List.of());
        when(subareaRepository.findAll()).thenReturn(List.of());
        when(educationLevelRepository.findAll()).thenReturn(List.of());
        when(professionLevelRepository.findAll()).thenReturn(List.of());
    }

    private UserProfile capturarSalvo() {
        ArgumentCaptor<UserProfile> captor = ArgumentCaptor.forClass(UserProfile.class);
        verify(profileRepository).save(captor.capture());
        return captor.getValue();
    }

    private static KnowledgeSubarea subareaBackend() {
        return KnowledgeSubarea.builder()
                .id(SUB_BACKEND).areaId(AREA_TECNOLOGIA)
                .slug("backend").name("Back-end").sortOrder(1)
                .build();
    }

    private static UpdateProfileRequestDTO apenasProfissao(Long areaId, Long subareaId) {
        return new UpdateProfileRequestDTO(areaId, subareaId, null, null, null, null, null, null);
    }


    // ── Coerência área × subárea ─────────────────────────────────────────────

    @Nested
    class CoerenciaDeTaxonomia {

        @Test
        @DisplayName("subárea que não pertence à área escolhida é recusada")
        void subareaFromAnotherAreaIsRejected() {
            // O banco aceitaria: são duas FKs independentes, cada uma válida
            // isoladamente. A incoerência só existe na combinação.
            //
            // A área nem chega a ser consultada quando há subárea: o serviço a
            // valida por comparação com a área dona da subárea, o que dispensa
            // um existsById e é o motivo de não haver stub para ele aqui.
            usuarioExiste();
            when(subareaRepository.findById(SUB_BACKEND)).thenReturn(Optional.of(subareaBackend()));

            var dto = apenasProfissao(AREA_SAUDE, SUB_BACKEND);

            assertThatThrownBy(() -> profileService.updateProfile(EMAIL, dto))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("não pertence à área");

            verify(profileRepository, never()).save(any());
        }

        @Test
        @DisplayName("subárea sem área informada deriva a área da própria subárea")
        void subareaAloneDerivesItsArea() {
            usuarioExiste();
            catalogoVazio();
            when(subareaRepository.findById(SUB_BACKEND)).thenReturn(Optional.of(subareaBackend()));
            when(profileRepository.findByUserId(userId)).thenReturn(Optional.empty());
            when(profileRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            profileService.updateProfile(EMAIL, apenasProfissao(null, SUB_BACKEND));

            // Sem isso o perfil ficaria com subárea preenchida e área nula, e a
            // tela não teria como reconstruir o select de área.
            assertThat(capturarSalvo().getProfessionAreaId()).isEqualTo(AREA_TECNOLOGIA);
        }

        @Test
        @DisplayName("área inexistente é recusada")
        void unknownAreaIsRejected() {
            usuarioExiste();
            when(areaRepository.existsById(999L)).thenReturn(false);

            assertThatThrownBy(() -> profileService.updateProfile(EMAIL, apenasProfissao(999L, null)))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Área");

            verify(profileRepository, never()).save(any());
        }

        @Test
        @DisplayName("subárea inexistente é recusada")
        void unknownSubareaIsRejected() {
            usuarioExiste();
            when(subareaRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> profileService.updateProfile(EMAIL, apenasProfissao(null, 999L)))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Subárea");

            verify(profileRepository, never()).save(any());
        }

        @Test
        @DisplayName("nível de profissão inexistente é recusado")
        void unknownProfessionLevelIsRejected() {
            usuarioExiste();
            when(professionLevelRepository.existsById(999L)).thenReturn(false);

            var dto = new UpdateProfileRequestDTO(null, null, 999L, null, null, null, null, null);

            assertThatThrownBy(() -> profileService.updateProfile(EMAIL, dto))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("nível de profissão");

            verify(profileRepository, never()).save(any());
        }
    }


    // ── Gravação ─────────────────────────────────────────────────────────────

    @Nested
    class Gravacao {

        @Test
        @DisplayName("perfil vazio é aceito: todos os campos são opcionais")
        void fullyEmptyPayloadIsAccepted() {
            // O onboarding pode ser pulado, e as configurações permitem limpar
            // o que já foi respondido.
            usuarioExiste();
            catalogoVazio();
            when(profileRepository.findByUserId(userId)).thenReturn(Optional.empty());
            when(profileRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            profileService.updateProfile(EMAIL,
                    new UpdateProfileRequestDTO(null, null, null, null, null, null, null, null));

            var salvo = capturarSalvo();
            assertThat(salvo.getUserId()).isEqualTo(userId);
            assertThat(salvo.getProfessionAreaId()).isNull();
            assertThat(salvo.getEducationLevelId()).isNull();
        }

        @Test
        @DisplayName("segunda gravação atualiza o perfil existente em vez de criar outro")
        void secondSaveUpdatesInsteadOfDuplicating() {
            // user_id é único no banco: sem o upsert, a segunda gravação
            // estouraria violação de constraint em vez de editar o perfil.
            var existente = UserProfile.builder()
                    .id(UUID.randomUUID())
                    .userId(userId)
                    .professionTitle("Cargo antigo")
                    .build();

            usuarioExiste();
            catalogoVazio();
            when(profileRepository.findByUserId(userId)).thenReturn(Optional.of(existente));
            when(profileRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            var dto = new UpdateProfileRequestDTO(
                    null, null, null, "Cargo novo", null, null, null, null);

            profileService.updateProfile(EMAIL, dto);

            var salvo = capturarSalvo();
            assertThat(salvo.getId()).isEqualTo(existente.getId());
            assertThat(salvo.getProfessionTitle()).isEqualTo("Cargo novo");
        }

        @Test
        @DisplayName("texto em branco vira null, não string vazia")
        void blankTextBecomesNull() {
            usuarioExiste();
            catalogoVazio();
            when(profileRepository.findByUserId(userId)).thenReturn(Optional.empty());
            when(profileRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            var dto = new UpdateProfileRequestDTO(
                    null, null, null, "   ", null, null, null, "  UFBA  ");

            profileService.updateProfile(EMAIL, dto);

            var salvo = capturarSalvo();
            // Dois jeitos de dizer "não informado" viram consulta com OR em todo
            // lugar que ler o campo.
            assertThat(salvo.getProfessionTitle()).isNull();
            assertThat(salvo.getInstitution()).isEqualTo("UFBA");
        }

        @Test
        @DisplayName("e-mail sem cadastro não grava perfil")
        void unknownEmailDoesNotStoreAnything() {
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> profileService.updateProfile(EMAIL, apenasProfissao(null, null)))
                    .isInstanceOf(UsernameNotFoundException.class);

            verify(profileRepository, never()).save(any());
        }
    }


    // ── Leitura ──────────────────────────────────────────────────────────────

    @Nested
    class Leitura {

        @Test
        @DisplayName("usuário sem perfil recebe resposta vazia, e não erro")
        void userWithoutProfileGetsEmptyResponse() {
            // Quem acabou de verificar o e-mail cai na tela de onboarding antes
            // de existir linha em user_profiles.
            usuarioExiste();
            when(profileRepository.findByUserId(userId)).thenReturn(Optional.empty());

            var resposta = profileService.getProfile(EMAIL);

            assertThat(resposta.professionArea()).isNull();
            assertThat(resposta.educationLevel()).isNull();
            assertThat(resposta.updatedAt()).isNull();
            // Nenhum catálogo é lido quando não há perfil.
            verify(areaRepository, never()).findAll();
        }

        @Test
        @DisplayName("opções agrupam cada subárea sob a própria área")
        void optionsNestSubareasUnderTheirArea() {
            when(subareaRepository.findAllByOrderByAreaIdAscSortOrderAscNameAsc())
                    .thenReturn(List.of(subareaBackend()));
            when(areaRepository.findAllByOrderBySortOrderAscNameAsc()).thenReturn(List.of(
                    KnowledgeArea.builder().id(AREA_TECNOLOGIA).slug("tecnologia").name("Tecnologia").sortOrder(1).build(),
                    KnowledgeArea.builder().id(AREA_SAUDE).slug("saude").name("Saúde").sortOrder(2).build()));
            when(educationLevelRepository.findAllByOrderByRankAsc()).thenReturn(List.of(
                    EducationLevel.builder().id(NIVEL_SUPERIOR).slug("superior").name("Ensino Superior").rank(5).build()));
            when(professionLevelRepository.findAllByOrderByRankAsc()).thenReturn(List.of(
                    ProfessionLevel.builder().id(NIVEL_PLENO).slug("pleno").name("Pleno").rank(3).build()));

            var opcoes = profileService.getOptions();

            assertThat(opcoes.areas()).hasSize(2);
            assertThat(opcoes.areas().get(0).subareas()).hasSize(1);
            // Área sem subárea vem com lista vazia, não null: o select do
            // frontend itera sem precisar checar.
            assertThat(opcoes.areas().get(1).subareas()).isEmpty();
            assertThat(opcoes.educationLevels()).hasSize(1);
            assertThat(opcoes.professionLevels()).hasSize(1);
        }
    }
}
