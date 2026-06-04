package com.brasilpanel.backend.mappers;

import com.brasilpanel.backend.dto.user.UserRequestDTO;
import com.brasilpanel.backend.dto.user.UserResponseDTO;
import com.brasilpanel.backend.model.UserEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;


@Mapper(componentModel = "spring")
public interface UserMapper {

    // MapStruct mapeia name, email, role, createdAt automaticamente (mesmos nomes)
    UserResponseDTO toResponse(UserEntity entity);

    // O role não vem do DTO de registro — é sempre USER por padrão no builder
    @Mapping(target = "role",      ignore = true)
    @Mapping(target = "id",        ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    UserEntity toEntity(UserRequestDTO dto);
}
