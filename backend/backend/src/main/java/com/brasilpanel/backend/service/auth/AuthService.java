package com.brasilpanel.backend.service.auth;

import com.brasilpanel.backend.config.jwt.JwtService;
import com.brasilpanel.backend.dto.user.*;
import com.brasilpanel.backend.mappers.UserMapper;
import com.brasilpanel.backend.model.AuthChallenge;
import com.brasilpanel.backend.model.Role;
import com.brasilpanel.backend.model.AuthChallengePurpose;
import com.brasilpanel.backend.model.UserEntity;
import com.brasilpanel.backend.repository.user.UserRepository;
import com.brasilpanel.backend.service.admin.AdminTwoFactorService;
import com.brasilpanel.backend.service.email.EmailOutboxService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository      userRepository;
    private final PasswordEncoder     passwordEncoder;
    private final JwtService          jwtService;
    private final AuthenticationManager authenticationManager;
    private final UserMapper          userMapper;
    private final EmailOutboxService  emailOutbox;
    private final LoginAttemptLimiter loginAttemptLimiter;
    private final AdminTwoFactorService adminTwoFactor;
    private final AuthChallengeService authChallenges;

    private static final SecureRandom RANDOM = new SecureRandom();

    // Mensagens deliberadamente genéricas: /verify-email e /resend-code não exigem
    // senha, então qualquer diferença de resposta vira um oráculo de cadastro.
    private static final String CODIGO_INVALIDO = "Código inválido.";
    private static final String REENVIO_GENERICO =
            "Se houver um cadastro pendente para este e-mail, um novo código foi enviado.";

    // Mesma razão: /forgot-password não exige credencial nenhuma, então uma resposta que
    // dependesse da existência da conta viraria um oráculo de quais e-mails têm cadastro.
    private static final String RECUPERACAO_GENERICA =
            "Se houver uma conta para este e-mail, um código de recuperação foi enviado.";


    // ── Registro ──────────────────────────────────────────────────────────────

    public RegisterResponseDTO registerUser(UserRequestDTO dto) {
        Optional<UserEntity> existente = userRepository.findByEmail(dto.email());

        // Conta já verificada: recusa genérica, para não virar oráculo de cadastro.
        if (existente.isPresent() && existente.get().isVerified()) {
            throw new IllegalArgumentException("Dados de cadastro inválidos");
        }

        // Cadastro pendente com o mesmo e-mail: reemite o código em vez de recusar.
        //
        // Antes, QUALQUER e-mail existente era recusado. Como o usuário é salvo antes
        // do envio, uma falha de e-mail deixava a conta criada e não verificada — e a
        // tentativa seguinte batia nessa recusa. Como a tela de verificação só é
        // alcançável pela navegação de um cadastro bem-sucedido (VerifyEmailPage lê o
        // e-mail do state da rota), a pessoa ficava sem caminho nenhum pela interface.
        //
        // Reemitir é seguro: quem não tem acesso à caixa de entrada não conclui nada,
        // e a senha da conta pendente é reescrita pela informada agora — cadastro não
        // confirmado não é credencial que mereça proteção.
        UserEntity usuario = existente
                .map(pendente -> reemitir(pendente, dto))
                .orElseGet(() -> novoUsuario(dto));

        userRepository.save(usuario);
        emailOutbox.enqueueVerificationCode(dto.email());

        return new RegisterResponseDTO(
                "Código de verificação enviado para " + dto.email() + ". Válido por 15 minutos."
        );
    }

    private UserEntity novoUsuario(UserRequestDTO dto) {
        return UserEntity.builder()
                .name(dto.name())
                .email(dto.email())
                .password(passwordEncoder.encode(dto.password()))
                .verified(false)
                .verificationCode(generateCode())
                .verificationCodeExpiresAt(LocalDateTime.now().plusMinutes(15))
                .build();
    }

    private UserEntity reemitir(UserEntity pendente, UserRequestDTO dto) {
        pendente.setName(dto.name());
        pendente.setPassword(passwordEncoder.encode(dto.password()));
        pendente.setVerificationCode(generateCode());
        pendente.setVerificationCodeExpiresAt(LocalDateTime.now().plusMinutes(15));
        return pendente;
    }


    // ── Verificação de e-mail ─────────────────────────────────────────────────

    public AuthResponseDTO verifyEmail(VerifyEmailRequestDTO dto) {
        // Mensagem única para e-mail inexistente, conta já verificada e código
        // errado: este endpoint não exige senha, então respostas distintas
        // permitiriam descobrir quais e-mails têm conta e em que estado.
        UserEntity user = userRepository.findByEmail(dto.email())
                .orElseThrow(() -> new IllegalArgumentException(CODIGO_INVALIDO));

        if (user.isVerified()) {
            throw new IllegalArgumentException(CODIGO_INVALIDO);
        }
        if (user.getVerificationCode() == null
                || !user.getVerificationCode().equals(dto.code())) {
            throw new IllegalArgumentException(CODIGO_INVALIDO);
        }
        if (user.getVerificationCodeExpiresAt() == null
                || user.getVerificationCodeExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Código expirado. Solicite um novo.");
        }

        // Marca como verificado e limpa o código
        user.setVerified(true);
        user.setVerificationCode(null);
        user.setVerificationCodeExpiresAt(null);
        userRepository.save(user);

        // Retorna JWT — o usuário está autenticado
        return new AuthResponseDTO(
                jwtService.generateToken(user),
                user.getName(),
                user.getEmail(),
                user.getRole().name(),
                jwtService.getExpirationMs());
    }


    // ── Reenviar código ───────────────────────────────────────────────────────

    public RegisterResponseDTO resendCode(ResendCodeRequestDTO dto) {
        // Resposta idêntica em todos os casos: e-mail inexistente e conta já
        // verificada não podem ser distinguidos de um reenvio bem-sucedido, ou o
        // endpoint vira um oráculo de quais e-mails estão cadastrados.
        Optional<UserEntity> encontrado = userRepository.findByEmail(dto.email());

        if (encontrado.isEmpty() || encontrado.get().isVerified()) {
            return new RegisterResponseDTO(REENVIO_GENERICO);
        }

        UserEntity user = encontrado.get();
        String code = generateCode();
        user.setVerificationCode(code);
        user.setVerificationCodeExpiresAt(LocalDateTime.now().plusMinutes(15));
        userRepository.save(user);

        emailOutbox.enqueueVerificationCode(dto.email());

        return new RegisterResponseDTO("Novo código enviado para " + dto.email() + ".");
    }


    // ── Login ─────────────────────────────────────────────────────────────────

    public LoginOutcomeDTO loginUser(LoginRequestDTO dto) {
        UserEntity user = autenticar(dto.email(), dto.password());

        // Admin não recebe sessão aqui: acertar a senha só o leva ao segundo fator.
        if (adminTwoFactor.isRequiredFor(user)) {
            adminTwoFactor.issue(user, AuthChallengePurpose.LOGIN, null);
            return LoginOutcomeDTO.desafioPendente(
                    "Código de confirmação enviado. Válido por 15 minutos.");
        }

        return LoginOutcomeDTO.autenticado(sessaoDe(user));
    }

    /**
     * Conclui o login de admin conferindo o código do segundo fator.
     *
     * <p>Reautentica antes de olhar o código: ver o javadoc de
     * {@link ConfirmAdminLoginRequestDTO} — sem isso, qualquer um queimaria o desafio do
     * dono só conhecendo o e-mail dele.
     */
    public AuthResponseDTO confirmAdminLogin(ConfirmAdminLoginRequestDTO dto) {
        UserEntity user = autenticar(dto.email(), dto.password());

        // Chegar aqui sem 2FA ligado significa desafio que não existe: recusa em vez de
        // emitir sessão por um caminho que deveria estar fechado.
        if (!adminTwoFactor.isRequiredFor(user)) {
            throw new IllegalArgumentException(AdminTwoFactorService.CODIGO_INVALIDO);
        }

        adminTwoFactor.consume(user, AuthChallengePurpose.LOGIN, dto.code());
        return sessaoDe(user);
    }

    /** Credenciais + conta verificada. Compartilhado pelo login e pela confirmação. */
    private UserEntity autenticar(String email, String password) {
        loginAttemptLimiter.checkNotBlocked(email);

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, password)
            );
        } catch (BadCredentialsException e) {
            loginAttemptLimiter.recordFailure(email);
            throw e;
        }
        loginAttemptLimiter.reset(email);

        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado"));

        if (!user.isVerified()) {
            throw new IllegalStateException("E-mail não verificado. Verifique sua caixa de entrada.");
        }
        return user;
    }

    private AuthResponseDTO sessaoDe(UserEntity user) {
        return new AuthResponseDTO(
                jwtService.generateToken(user),
                user.getName(),
                user.getEmail(),
                user.getRole().name(),
                jwtService.getExpirationMs());
    }


    // ── Helpers ───────────────────────────────────────────────────────────────

    /** Gera um código numérico de 6 dígitos com SecureRandom. */
    private String generateCode() {
        return String.format("%06d", RANDOM.nextInt(1_000_000));
    }



    // ── Alterar nome ──────────────────────────────────────────────────────────────
    public void updateName(String email, UpdateNameRequestDTO dto) {
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado"));

        if (dto.name().trim().split("\\s+").length < 2) {
            throw new IllegalArgumentException("Informe nome e sobrenome.");
        }

        user.setName(dto.name().trim());
        userRepository.save(user);
    }

    // ── Alterar senha ─────────────────────────────────────────────────────────────

    /**
     * @return {@code true} se a troca ficou pendente de confirmação por e-mail (admin),
     *         {@code false} se já foi aplicada
     */
    public boolean updatePassword(String email, UpdatePasswordRequestDTO dto) {
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado"));

        if (!passwordEncoder.matches(dto.currentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Senha atual incorreta.");
        }

        if (passwordEncoder.matches(dto.newPassword(), user.getPassword())) {
            throw new IllegalArgumentException("A nova senha deve ser diferente da atual.");
        }

        String novoHash = passwordEncoder.encode(dto.newPassword());

        // Admin: a senha nova fica retida no desafio. Gravar em users.password agora
        // aplicaria a troca antes do segundo fator — exatamente o que este fluxo impede.
        if (adminTwoFactor.isRequiredFor(user)) {
            adminTwoFactor.issue(user, AuthChallengePurpose.PASSWORD_CHANGE, novoHash);
            return true;
        }

        aplicarSenha(user, novoHash);
        return false;
    }

    /** Conclui a troca de senha do admin conferindo o código do segundo fator. */
    public void confirmAdminPasswordChange(String email, ConfirmAdminPasswordRequestDTO dto) {
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado"));

        if (!adminTwoFactor.isRequiredFor(user)) {
            throw new IllegalArgumentException(AdminTwoFactorService.CODIGO_INVALIDO);
        }

        AuthChallenge desafio =
                adminTwoFactor.consume(user, AuthChallengePurpose.PASSWORD_CHANGE, dto.code());

        // Defesa contra desafio da finalidade certa mas sem carga: não deveria existir,
        // e aplicar hash nulo apagaria a senha da conta.
        if (desafio.getPendingPasswordHash() == null) {
            throw new IllegalArgumentException(AdminTwoFactorService.CODIGO_INVALIDO);
        }

        aplicarSenha(user, desafio.getPendingPasswordHash());
    }

    private void aplicarSenha(UserEntity user, String novoHash) {
        user.setPassword(novoHash);
        // Derruba as sessões abertas: o JwtService recusa todo token emitido antes
        // deste instante. Sem esta linha, quem tivesse acesso indevido à conta
        // continuaria dentro apesar da troca de senha.
        user.setPasswordChangedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    // ── Recuperação de senha ──────────────────────────────────────────────────────

    /**
     * Emite o código de recuperação, se houver conta para o e-mail.
     *
     * <p>A resposta é a mesma em todos os casos — conta inexistente, conta pendente de
     * verificação e código enviado. Sem isso, quem quisesse descobrir se um endereço tem
     * cadastro bastaria pedir a recuperação e ler a resposta.
     *
     * <p>Só conta verificada recupera. Cadastro não confirmado não provou o vínculo com a
     * caixa de entrada, e o caminho dele é concluir a verificação — que reenvia código pelo
     * próprio {@code /register}.
     */
    public RegisterResponseDTO requestPasswordReset(ForgotPasswordRequestDTO dto) {
        userRepository.findByEmail(dto.email())
                .filter(UserEntity::isVerified)
                .ifPresent(user -> authChallenges.issue(
                        user, AuthChallengePurpose.PASSWORD_RESET, destinoDoCodigo(user), null));

        return new RegisterResponseDTO(RECUPERACAO_GENERICA);
    }

    /**
     * Redefine a senha com o código recebido.
     *
     * <p>Aplica {@code passwordChangedAt}, então toda sessão aberta cai — inclusive a de
     * quem tenha invadido a conta, que é a razão de alguém recuperar a senha às pressas.
     */
    public void resetPassword(ResetPasswordRequestDTO dto) {
        // Mesma mensagem de código inválido para e-mail inexistente e conta não verificada:
        // esta rota também não exige credencial.
        UserEntity user = userRepository.findByEmail(dto.email())
                .filter(UserEntity::isVerified)
                .orElseThrow(() -> new IllegalArgumentException(AuthChallengeService.CODIGO_INVALIDO));

        authChallenges.consume(user, AuthChallengePurpose.PASSWORD_RESET, dto.code());
        aplicarSenha(user, passwordEncoder.encode(dto.newPassword()));
    }

    /**
     * Para onde vai o código de recuperação.
     *
     * <p>No admin, o endereço de segurança — e não o e-mail da conta. Senão a recuperação
     * seria um desvio do segundo fator: quem tomasse a caixa de entrada da conta redefiniria
     * a senha por ali. Continuaria barrado no login pelo 2FA, mas não há motivo para deixar
     * a porta entreaberta.
     */
    private String destinoDoCodigo(UserEntity user) {
        return user.getRole() == Role.ADMIN
                ? adminTwoFactor.recipientFor(user)
                : user.getEmail();
    }


    // ── Deletar conta ─────────────────────────────────────────────────────────────
    public void deleteAccount(String email, DeleteAccountRequestDTO dto) {
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado"));

        if (!passwordEncoder.matches(dto.password(), user.getPassword())) {
            throw new IllegalArgumentException("Senha incorreta.");
        }

        userRepository.delete(user);
    }


}