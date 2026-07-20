//package com.brasilpanel.backend.service;
//
//
//import com.brasilpanel.backend.dto.user.LoginRequestDTO;
//import com.brasilpanel.backend.dto.user.UserRequestDTO;
//
//import com.brasilpanel.backend.config.jwt.JwtService;
//import com.brasilpanel.backend.dto.user.AuthResponseDTO;
//import com.brasilpanel.backend.model.UserEntity;
//import com.brasilpanel.backend.repository.user.UserRepository;
//import com.brasilpanel.backend.service.auth.AuthService;
//import org.junit.jupiter.api.BeforeEach;
//import org.junit.jupiter.api.Test;
//import org.junit.jupiter.api.extension.ExtendWith;
//import org.mockito.InjectMocks;
//import org.mockito.Mock;
//import org.mockito.junit.jupiter.MockitoExtension;
//import org.springframework.security.authentication.AuthenticationManager;
//import org.springframework.security.crypto.password.PasswordEncoder;
//
//import java.util.Optional;
//
//import static org.junit.jupiter.api.Assertions.*;
//import static org.junit.jupiter.api.Assertions.assertEquals;
//import static org.mockito.Mockito.*;
//
//@ExtendWith(MockitoExtension.class)
//class AuthServiceTest {
//
//    @Mock
//    private UserRepository userRepository;
//
//    @Mock
//    private PasswordEncoder passwordEncoder;
//
//    @Mock
//    private JwtService jwtService;
//
//    @InjectMocks
//    private AuthService authService;
//
//    @Mock
//    private AuthenticationManager authenticationManager;
//
//    private UserRequestDTO requestDTO;
//    private LoginRequestDTO loginDTO;
//
//    @BeforeEach
//    void setUp() {
//        requestDTO = new UserRequestDTO("Jailton Santos", "jailton@gmail.com", "jailton2002@");
//        loginDTO = new LoginRequestDTO("jailton@gmail.com", "jailton2002@");
//    }
//
//    @Test
//    void throwExceptionForDuplicatedEmail() {
//        // Simula que o email já existe no banco
//        when(userRepository.findByEmail(requestDTO.email()))
//                .thenReturn(Optional.of(new UserEntity()));
//
//        // Verifica que lança a exception
//        assertThrows(IllegalArgumentException.class,
//                () -> authService.registerUser(requestDTO));
//    }
//
//    @Test
//    void registerUserAndReturnToken() {
//        // Email
//        when(userRepository.findByEmail(requestDTO.email()))
//                .thenReturn(Optional.empty());
//
//        // encode da senha
//        when(passwordEncoder.encode(requestDTO.password()))
//                .thenReturn("senhaEncriptada");
//
//        // token gerado
//        when(jwtService.generateToken(any(UserEntity.class)))
//                .thenReturn("token.jwt.aqui");
//
//        AuthResponseDTO response = authService.registerUser(requestDTO);
//
//        assertEquals("token.jwt.aqui", response.token());
//        verify(userRepository).save(any(UserEntity.class));
//    }
//
//    @Test
//    void loginUserAndReturnToken(){
//        when(authenticationManager.authenticate(any()))
//                .thenReturn(null);
//        when(userRepository.findByEmail(loginDTO.email()))
//                .thenReturn(Optional.of(new UserEntity()));
//
//        when(jwtService.generateToken(any(UserEntity.class)))
//                .thenReturn("token.recebido");
//
//        AuthResponseDTO response = authService.loginUser(loginDTO);
//
//        assertEquals("token.recebido", response.token());
//        verify(userRepository).findByEmail(loginDTO.email());
//
//    }
//}