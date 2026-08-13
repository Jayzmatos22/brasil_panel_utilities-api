package com.brasilpanel.backend.controller.profile;

import com.brasilpanel.backend.dto.profile.ProfileOptionsDTO;
import com.brasilpanel.backend.dto.profile.ProfileResponseDTO;
import com.brasilpanel.backend.dto.profile.UpdateProfileRequestDTO;
import com.brasilpanel.backend.service.profile.ProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * Perfil profissional e acadêmico do usuário autenticado.
 *
 * <p>Todas as rotas exigem sessão (caem no {@code anyRequest().authenticated()}
 * do SecurityConfig): o onboarding acontece logo após a verificação de e-mail,
 * quando o JWT já está no cookie.
 */
@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
@Tag(name = "Perfil", description = "Perfil profissional e acadêmico do usuário")
public class ProfileController {

    private final ProfileService profileService;

    @Operation(summary = "Catálogo de opções",
               description = "Árvore área → subárea (compartilhada) e níveis de educação e profissão")
    @ApiResponse(responseCode = "200", description = "Opções para montar os selects")
    @GetMapping("/options")
    public ResponseEntity<ProfileOptionsDTO> options() {
        return ResponseEntity.ok(profileService.getOptions());
    }

    @Operation(summary = "Perfil atual",
               description = "Retorna o perfil do usuário autenticado (campos vazios se ainda não preenchido)")
    @ApiResponse(responseCode = "200", description = "Perfil do usuário")
    @GetMapping("/me")
    public ResponseEntity<ProfileResponseDTO> me(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(profileService.getProfile(userDetails.getUsername()));
    }

    @Operation(summary = "Salvar perfil",
               description = "Cria ou atualiza o perfil. Todos os campos são opcionais.")
    @ApiResponse(responseCode = "200", description = "Perfil salvo")
    @ApiResponse(responseCode = "400", description = "Referência inválida ou incoerente")
    @PutMapping("/me")
    public ResponseEntity<ProfileResponseDTO> update(
            @RequestBody @Valid UpdateProfileRequestDTO dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(profileService.updateProfile(userDetails.getUsername(), dto));
    }
}
