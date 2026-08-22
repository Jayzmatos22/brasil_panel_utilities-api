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
 * @param name  nome do usuário, para a interface identificá-lo por nome em vez
 *              de por e-mail. O cabeçalho do painel exibia
 *              {@code email.split("@")[0]} — "jailtonmatos200" no lugar de
 *              "Jailton" —, porque o nome existe em {@code UserEntity} mas não
 *              atravessava o login. Como o resto deste DTO, é dado de exibição:
 *              adulterá-lo no cliente não concede acesso a nada.
 * @param email identidade do usuário, para o frontend exibir sem decodificar nada
 * @param role  perfil do usuário, usado apenas para decidir o que renderizar;
 *              a autorização real é sempre validada no servidor
 * @param expiresInMs validade da sessão, para o cliente saber quando ela expira
 */
public record AuthResponseDTO(
        @JsonIgnore String token,
        String name,
        String email,
        String role,
        long expiresInMs) {}