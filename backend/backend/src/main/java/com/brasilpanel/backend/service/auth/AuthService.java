package com.brasilpanel.backend.service.auth;

import com.brasilpanel.backend.config.jwt.JwtService;
import com.brasilpanel.backend.dto.user.*;
import com.brasilpanel.backend.mappers.UserMapper;
import com.brasilpanel.backend.model.UserEntity;
import com.brasilpanel.backend.repository.user.UserRepository;
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

    private static final SecureRandom RANDOM = new SecureRandom();

    // Mensagens deliberadamente genéricas: /verify-email e /resend-code não exigem
    // senha, então qualquer diferença de resposta vira um oráculo de cadastro.
    private static final String CODIGO_INVALIDO = "Código inválido.";
    private static final String REENVIO_GENERICO =
            "Se houver um cadastro pendente para este e-mail, um novo código foi enviado.";


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
        // Derruba as sessões abertas: o JwtService recusa todo token emitido antes
        // deste instante. Sem esta linha, quem tivesse acesso indevido à conta
        // continuaria dentro apesar da troca de senha.
        user.setPasswordChangedAt(LocalDateTime.now());
        userRepository.save(user);
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