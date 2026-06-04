package com.brasilpanel.backend.service.auth;

import com.brasilpanel.backend.config.jwt.JwtService;
import com.brasilpanel.backend.dto.user.AuthResponseDTO;
import com.brasilpanel.backend.dto.user.LoginRequestDTO;
import com.brasilpanel.backend.dto.user.UserRequestDTO;
import com.brasilpanel.backend.mappers.UserMapper;
import com.brasilpanel.backend.model.UserEntity;
import com.brasilpanel.backend.repository.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final UserMapper userMapper;


    public AuthResponseDTO registerUser(UserRequestDTO dto) {
        // Não confirmamos ao cliente se o e-mail existe (evita user enumeration)
        if (userRepository.findByEmail(dto.email()).isPresent()) {
            throw new IllegalArgumentException("Dados de cadastro inválidos");
        }

        UserEntity newUser = UserEntity.builder()
                .name(dto.name())
                .email(dto.email())
                .password(passwordEncoder.encode(dto.password()))
                .build();

        userRepository.save(newUser);

        return new AuthResponseDTO(jwtService.generateToken(newUser));
    }


    public AuthResponseDTO loginUser(LoginRequestDTO dto) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(dto.email(), dto.password())
        );
        UserEntity user = userRepository.findByEmail(dto.email())
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado"));
        return new AuthResponseDTO(jwtService.generateToken(user));
    }
}
