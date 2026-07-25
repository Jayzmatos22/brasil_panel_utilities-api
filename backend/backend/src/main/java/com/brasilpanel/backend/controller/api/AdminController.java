package com.brasilpanel.backend.controller.api;

import com.brasilpanel.backend.dto.user.UserResponseDTO;
import com.brasilpanel.backend.mappers.UserMapper;
import com.brasilpanel.backend.model.Role;
import com.brasilpanel.backend.model.UserEntity;
import com.brasilpanel.backend.repository.user.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin", description = "Endpoints exclusivos para administradores")
public class AdminController {

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    /** Lista todos os usuários cadastrados. */
    @Operation(summary = "Listar usuários", description = "Retorna todos os usuários do sistema")
    @GetMapping("/users")
    public ResponseEntity<List<UserResponseDTO>> listUsers() {
        List<UserResponseDTO> users = userRepository.findAll()
                .stream()
                .map(userMapper::toResponse)
                .toList();
        return ResponseEntity.ok(users);
    }

    /** Promove um usuário comum para ADMIN. */
    @Operation(summary = "Promover usuário", description = "Altera o role de um usuário para ADMIN")
    @PutMapping("/users/{id}/promote")
    public ResponseEntity<UserResponseDTO> promoteUser(@PathVariable UUID id) {
        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));
        user.setRole(Role.ADMIN);
        userRepository.save(user);
        return ResponseEntity.ok(userMapper.toResponse(user));
    }

    /**
     * Rebaixa um ADMIN para USER.
     *
     * <p>A regra de não rebaixar a si mesmo é validada aqui, e não no frontend: o
     * endpoint é acessível diretamente, e um admin que se rebaixasse perderia o acesso
     * ao painel sem forma de reverter pela interface.
     */
    @Operation(summary = "Revogar admin", description = "Altera o role de um usuário de ADMIN para USER")
    @PutMapping("/users/{id}/demote")
    public ResponseEntity<UserResponseDTO> demoteUser(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails currentUser) {
        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));

        if (user.getUsername().equals(currentUser.getUsername())) {
            throw new IllegalArgumentException("Você não pode revogar o seu próprio acesso de administrador.");
        }

        user.setRole(Role.USER);
        userRepository.save(user);
        return ResponseEntity.ok(userMapper.toResponse(user));
    }
}