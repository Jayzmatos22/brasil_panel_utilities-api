package com.brasilpanel.backend.dto.user;

import com.fasterxml.jackson.annotation.JsonIgnore;

/**
 * Resposta de autenticação.
 *
 * <p>O JWT <strong>não</strong> é serializado: ele existe aqui apenas para o
 * {@code AuthController} montar o cookie httpOnly. Devolvê-lo no corpo permitiria
 * ao JavaScript lê-lo e guardá-lo, anulando a proteção contra XSS.
 *
 * @param token JWT de acesso — uso interno, nunca chega ao cliente no corpo
 * @param email identidade do usuário, para o frontend exibir sem decodificar nada
 * @param role  perfil do usuário, usado apenas para decidir o que renderizar;
 *              a autorização real é sempre validada no servidor
 * @param expiresInMs validade da sessão, para o cliente saber quando ela expira
 */
public record AuthResponseDTO(
        @JsonIgnore String token,
        String email,
        String role,
        long expiresInMs) {}