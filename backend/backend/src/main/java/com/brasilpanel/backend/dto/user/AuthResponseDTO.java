package com.brasilpanel.backend.dto.user;

/**
 * Resposta de autenticação.
 *
 * @param token JWT de acesso — também enviado em cookie httpOnly pelo AuthController
 * @param email identidade do usuário, para o frontend exibir sem decodificar o token
 * @param role  perfil do usuário, usado apenas para decidir o que renderizar;
 *              a autorização real é sempre validada no servidor
 * @param expiresInMs validade da sessão, para o cliente não precisar ler o token
 */
public record AuthResponseDTO(String token, String email, String role, long expiresInMs) {}