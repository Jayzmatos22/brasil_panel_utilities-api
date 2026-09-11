package com.brasilpanel.backend.service.auth;

import com.brasilpanel.backend.model.Role;
import com.brasilpanel.backend.model.UserEntity;
import com.brasilpanel.backend.repository.user.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Cadastro nunca concluído ficava para sempre: nome e e-mail de alguém que nunca
 * virou usuário, guardados sem finalidade, e listados no painel junto com as
 * contas de verdade.
 *
 * <p>Roda contra o banco de verdade (H2 com as migrations) porque o que se quer
 * verificar é a consulta em lote e o comportamento do cascade — nenhum dos dois
 * existe num mock.
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(UnverifiedAccountService.class)
@ActiveProfiles("test")
class UnverifiedAccountServiceTest {

    private static final int RETENCAO_DIAS = 7;

    @Autowired private UnverifiedAccountService service;
    @Autowired private UserRepository userRepository;
    @Autowired private TestEntityManager entityManager;

    /**
     * {@code createdAt} é {@code @CreationTimestamp} e {@code updatable = false}: o
     * Hibernate o preenche no insert e nunca o inclui num update. Envelhecer a conta
     * exige escrever direto na tabela — por isso a consulta nativa.
     */
    private UserEntity criar(String email, boolean verificado, int diasAtras) {
        UserEntity user = UserEntity.builder()
                .name("Fulano de Tal")
                .email(email)
                .password("hash")
                .role(Role.USER)
                .verified(verificado)
                .build();
        UserEntity salvo = entityManager.persistFlushFind(user);

        entityManager.getEntityManager()
                .createNativeQuery("update users set created_at = ?1 where id = ?2")
                .setParameter(1, LocalDateTime.now().minusDays(diasAtras))
                .setParameter(2, salvo.getId())
                .executeUpdate();
        entityManager.flush();
        entityManager.clear();
        return salvo;
    }

    private boolean existe(UserEntity user) {
        return userRepository.findById(user.getId()).isPresent();
    }

    @Nested
    @DisplayName("O que é apagado")
    class Apaga {

        @Test
        @DisplayName("cadastro não verificado além do prazo é removido")
        void removesStaleUnverified() {
            UserEntity velho = criar("velho@exemplo.com", false, RETENCAO_DIAS + 1);

            int removidos = service.purge(RETENCAO_DIAS);

            assertThat(removidos).isEqualTo(1);
            assertThat(existe(velho)).isFalse();
        }

        @Test
        @DisplayName("devolve quantos foram removidos")
        void reportsHowManyWereRemoved() {
            criar("a@exemplo.com", false, RETENCAO_DIAS + 1);
            criar("b@exemplo.com", false, RETENCAO_DIAS + 30);

            assertThat(service.purge(RETENCAO_DIAS)).isEqualTo(2);
        }
    }

    @Nested
    @DisplayName("O que NÃO é apagado")
    class Preserva {

        @Test
        @DisplayName("conta verificada antiga fica")
        void keepsOldVerifiedAccounts() {
            UserEntity verificado = criar("verificado@exemplo.com", true, RETENCAO_DIAS + 365);

            service.purge(RETENCAO_DIAS);

            // O critério é "nunca concluiu o cadastro", não "é antigo".
            assertThat(existe(verificado)).isTrue();
        }

        @Test
        @DisplayName("cadastro não verificado dentro do prazo fica")
        void keepsRecentUnverified() {
            UserEntity recente = criar("recente@exemplo.com", false, RETENCAO_DIAS - 1);

            service.purge(RETENCAO_DIAS);

            // Ainda pode abrir o e-mail e confirmar.
            assertThat(existe(recente)).isTrue();
        }

        @Test
        @DisplayName("nada a apagar devolve zero e não quebra")
        void nothingToPurgeIsFine() {
            assertThat(service.purge(RETENCAO_DIAS)).isZero();
        }
    }

    @Test
    @DisplayName("o prazo é o parâmetro, não um valor fixo no código")
    void retentionComesFromTheParameter() {
        UserEntity user = criar("dez-dias@exemplo.com", false, 10);

        // Com 30 dias de retenção, uma conta de 10 dias ainda não venceu.
        assertThat(service.purge(30)).isZero();
        assertThat(existe(user)).isTrue();

        assertThat(service.purge(5)).isEqualTo(1);
    }

    /**
     * A consulta em lote apaga direto na tabela, sem passar pelo cascade do JPA. Ela
     * só é segura porque {@code user_profiles} e {@code auth_challenge} declaram
     * {@code on delete cascade} no banco (V3 e V6). Se essa suposição deixar de
     * valer, o expurgo passa a estourar violação de chave estrangeira toda madrugada
     * — e é este teste que avisa.
     */
    @Test
    @DisplayName("apagar a conta leva junto as linhas dependentes")
    void deletingCascadesToDependentRows() {
        UserEntity user = criar("com-perfil@exemplo.com", false, RETENCAO_DIAS + 1);

        entityManager.getEntityManager()
                .createNativeQuery("insert into user_profiles (id, user_id, updated_at)"
                        + " values (?1, ?2, ?3)")
                .setParameter(1, UUID.randomUUID())
                .setParameter(2, user.getId())
                .setParameter(3, LocalDateTime.now())
                .executeUpdate();
        entityManager.flush();
        entityManager.clear();

        assertThat(contarPerfis(user)).isOne();

        service.purge(RETENCAO_DIAS);
        entityManager.clear();

        assertThat(existe(user)).isFalse();
        assertThat(contarPerfis(user)).isZero();
    }

    private long contarPerfis(UserEntity user) {
        Number total = (Number) entityManager.getEntityManager()
                .createNativeQuery("select count(*) from user_profiles where user_id = ?1")
                .setParameter(1, user.getId())
                .getSingleResult();
        return total.longValue();
    }
}
