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

    /** Rebaixa um ADMIN para USER (não afeta o próprio admin logado — validar no front). */
    @Operation(summary = "Revogar admin", description = "Altera o role de um usuário de ADMIN para USER")
    @PutMapping("/users/{id}/demote")
    public ResponseEntity<UserResponseDTO> demoteUser(@PathVariable UUID id) {
        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));
        user.setRole(Role.USER);
        userRepository.save(user);
        return ResponseEntity.ok(userMapper.toResponse(user));
    }
}