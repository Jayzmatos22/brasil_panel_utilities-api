package com.brasilpanel.backend.mappers;

import com.brasilpanel.backend.dto.user.UserRequestDTO;
import com.brasilpanel.backend.dto.user.UserResponseDTO;
import com.brasilpanel.backend.model.UserEntity;
import org.mapstruct.Mapper;


@Mapper(componentModel = "spring")
public interface UserMapper {

    UserResponseDTO toResponse(UserEntity entity);

    UserEntity toEntity(UserRequestDTO dto);
}
