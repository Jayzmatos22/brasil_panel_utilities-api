package com.brasilpanel.backend.service.auth;

import com.brasilpanel.backend.config.jwt.JwtService;
import com.brasilpanel.backend.dto.user.*;
import com.brasilpanel.backend.mappers.UserMapper;
import com.brasilpanel.backend.model.UserEntity;
import com.brasilpanel.backend.repository.user.UserRepository;
import com.brasilpanel.backend.service.email.EmailService;
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
    private final EmailService        emailService;
    private final LoginAttemptLimiter loginAttemptLimiter;

    private static final SecureRandom RANDOM = new SecureRandom();

    // Mensagens deliberadamente genéricas: /verify-email e /resend-code não exigem
    // senha, então qualquer diferença de resposta vira um oráculo de cadastro.
    private static final String CODIGO_INVALIDO = "Código inválido.";
    private static final String REENVIO_GENERICO =
            "Se houver um cadastro pendente para este e-mail, um novo código foi enviado.";


    // ── Registro ──────────────────────────────────────────────────────────────

    public RegisterResponseDTO registerUser(UserRequestDTO dto) {
        // Não confirmamos se o e-mail existe para evitar user enumeration
        if (userRepository.findByEmail(dto.email()).isPresent()) {
            throw new IllegalArgumentException("Dados de cadastro inválidos");
        }

        String code = generateCode();

        UserEntity newUser = UserEntity.builder()
                .name(dto.name())
                .email(dto.email())
                .password(passwordEncoder.encode(dto.password()))
                .verified(false)
                .verificationCode(code)
                .verificationCodeExpiresAt(LocalDateTime.now().plusMinutes(15))
                .build();

        userRepository.save(newUser);
        emailService.sendVerificationCode(dto.email(), code);

        return new RegisterResponseDTO(
                "Código de verificação enviado para " + dto.email() + ". Válido por 15 minutos."
        );
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

        emailService.sendVerificationCode(dto.email(), code);

        return new RegisterResponseDTO("Novo código enviado para " + dto.email() + ".");
    }


    // ── Login ─────────────────────────────────────────────────────────────────

    public AuthResponseDTO loginUser(LoginRequestDTO dto) {
        loginAttemptLimiter.checkNotBlocked(dto.email());

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(dto.email(), dto.password())
            );
        } catch (BadCredentialsException e) {
            loginAttemptLimiter.recordFailure(dto.email());
            throw e;
        }
        loginAttemptLimiter.reset(dto.email());

        UserEntity user = userRepository.findByEmail(dto.email())
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado"));

        if (!user.isVerified()) {
            throw new IllegalStateException("E-mail não verificado. Verifique sua caixa de entrada.");
        }

        return new AuthResponseDTO(
                jwtService.generateToken(user),
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
    public void updatePassword(String email, UpdatePasswordRequestDTO dto) {
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado"));

        if (!passwordEncoder.matches(dto.currentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Senha atual incorreta.");
        }

        if (passwordEncoder.matches(dto.newPassword(), user.getPassword())) {
            throw new IllegalArgumentException("A nova senha deve ser diferente da atual.");
        }

        user.setPassword(passwordEncoder.encode(dto.newPassword()));
        userRepository.save(user);
    }

    // ── Perfil profissional (onboarding) ──────────────────────────────────────────

    /** Estado atual do perfil. Campos nulos são o esperado para quem nunca preencheu. */
    public ProfileResponseDTO getProfile(String email) {
        return toProfileResponse(buscarPorEmail(email));
    }

    /**
     * Grava o perfil e encerra o onboarding.
     *
     * <p>Também serve à edição posterior pelas configurações — daí o carimbo de
     * conclusão só ser aplicado na primeira vez: {@code onboardingCompletedAt}
     * responde "já passou pela etapa?", não "quando editou pela última vez?".
     */
    public ProfileResponseDTO updateProfile(String email, ProfileRequestDTO dto) {
        UserEntity user = buscarPorEmail(email);

        user.setProfession(dto.profession().trim());
        user.setArea(dto.area());
        user.setEducationLevel(dto.educationLevel());
        // Campo opcional: string vazia vira null, para o banco não guardar dois
        // jeitos diferentes de dizer "não informado".
        user.setInstitution(normalizarOpcional(dto.institution()));

        marcarOnboardingConcluido(user);
        userRepository.save(user);

        return toProfileResponse(user);
    }

    /**
     * Encerra o onboarding sem coletar nada ("pular por agora").
     *
     * <p>Idempotente e não destrutivo: chamar de novo não move o carimbo, e um
     * perfil já preenchido não é apagado.
     */
    public void skipOnboarding(String email) {
        UserEntity user = buscarPorEmail(email);

        if (user.getOnboardingCompletedAt() != null) {
            return;
        }

        marcarOnboardingConcluido(user);
        userRepository.save(user);
    }

    private void marcarOnboardingConcluido(UserEntity user) {
        if (user.getOnboardingCompletedAt() == null) {
            user.setOnboardingCompletedAt(LocalDateTime.now());
        }
    }

    private static String normalizarOpcional(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        return valor.trim();
    }

    private static ProfileResponseDTO toProfileResponse(UserEntity user) {
        return new ProfileResponseDTO(
                user.getProfession(),
                user.getArea(),
                user.getEducationLevel(),
                user.getInstitution(),
                user.getOnboardingCompletedAt());
    }

    private UserEntity buscarPorEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado"));
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