package com.brasilpanel.backend.service.auth;

import com.brasilpanel.backend.config.jwt.JwtService;
import com.brasilpanel.backend.dto.user.*;
import com.brasilpanel.backend.mappers.UserMapper;
import com.brasilpanel.backend.model.UserEntity;
import com.brasilpanel.backend.repository.user.UserRepository;
import com.brasilpanel.backend.service.email.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository      userRepository;
    private final PasswordEncoder     passwordEncoder;
    private final JwtService          jwtService;
    private final AuthenticationManager authenticationManager;
    private final UserMapper          userMapper;
    private final EmailService        emailService;

    private static final SecureRandom RANDOM = new SecureRandom();


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
        UserEntity user = userRepository.findByEmail(dto.email())
                .orElseThrow(() -> new IllegalArgumentException("Dados inválidos"));

        if (user.isVerified()) {
            throw new IllegalArgumentException("E-mail já verificado. Faça o login.");
        }
        if (user.getVerificationCode() == null
                || !user.getVerificationCode().equals(dto.code())) {
            throw new IllegalArgumentException("Código inválido.");
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
        return new AuthResponseDTO(jwtService.generateToken(user));
    }


    // ── Reenviar código ───────────────────────────────────────────────────────

    public RegisterResponseDTO resendCode(ResendCodeRequestDTO dto) {
        UserEntity user = userRepository.findByEmail(dto.email())
                .orElseThrow(() -> new IllegalArgumentException("Dados inválidos"));

        if (user.isVerified()) {
            throw new IllegalArgumentException("E-mail já verificado. Faça o login.");
        }

        String code = generateCode();
        user.setVerificationCode(code);
        user.setVerificationCodeExpiresAt(LocalDateTime.now().plusMinutes(15));
        userRepository.save(user);

        emailService.sendVerificationCode(dto.email(), code);

        return new RegisterResponseDTO("Novo código enviado para " + dto.email() + ".");
    }


    // ── Login ─────────────────────────────────────────────────────────────────

    public AuthResponseDTO loginUser(LoginRequestDTO dto) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(dto.email(), dto.password())
        );
        UserEntity user = userRepository.findByEmail(dto.email())
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado"));

        if (!user.isVerified()) {
            throw new IllegalStateException("E-mail não verificado. Verifique sua caixa de entrada.");
        }

        return new AuthResponseDTO(jwtService.generateToken(user));
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