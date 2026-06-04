package com.brasilpanel.backend.dto.user;

import com.brasilpanel.backend.model.Role;

import java.time.LocalDateTime;
import java.util.UUID;


public record UserResponseDTO(
        UUID id,
        String name,
        String email,
        Role role,
        LocalDateTime createdAt
) {}
