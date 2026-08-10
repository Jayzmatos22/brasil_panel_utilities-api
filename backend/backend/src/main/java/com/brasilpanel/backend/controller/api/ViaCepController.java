package com.brasilpanel.backend.controller.api;

import com.brasilpanel.backend.dto.api.viaCep.EnderecoCepDTO;
import com.brasilpanel.backend.service.api.viaCep.ViaCepService;
import com.brasilpanel.backend.validators.annotations.ValidCep;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequestMapping("/api/viacep")
@RestController
@RequiredArgsConstructor
public class ViaCepController {

    private final ViaCepService viaCepService;

    @Operation(summary = "Buscar endereço pelo CEP",
            description = "Retorna o endereço completo do CEP, com todos os campos do ViaCEP: "
                    + "cep, logradouro, complemento, unidade, bairro, municipio, municipioId (código IBGE), "
                    + "uf, estado, regiao, ddd, siafi e gia.")
    @ApiResponse(responseCode = "200", description = "Endereço encontrado")
    @ApiResponse(responseCode = "400", description = "CEP com formato inválido")
    @ApiResponse(responseCode = "404", description = "CEP não existe na base dos Correios")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com a API ViaCep")
    @GetMapping("/{cep}")
    public ResponseEntity<EnderecoCepDTO> getAddress(@PathVariable @ValidCep String cep) {
        return ResponseEntity.ok(viaCepService.getAddressByCep(cep));
    }

    @Operation(summary = "Buscar CEPs por logradouro",
            description = "Busca reversa: dado um estado, um município e um trecho do nome da rua, "
                    + "retorna até 50 endereços com seus CEPs. Município e logradouro exigem no mínimo "
                    + "3 caracteres — exigência da própria API de origem.")
    @ApiResponse(responseCode = "200", description = "Lista de endereços (vazia se nada casar com a busca)")
    @ApiResponse(responseCode = "400", description = "Parâmetro ausente ou curto demais")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com a API ViaCep")
    @GetMapping("/busca")
    public ResponseEntity<List<EnderecoCepDTO>> searchAddresses(
            @RequestParam @NotBlank @Pattern(regexp = "(?i)[a-z]{2}", message = "UF deve ter 2 letras") String uf,
            @RequestParam @NotBlank @Size(min = 3, message = "Município precisa de no mínimo 3 caracteres") String cidade,
            @RequestParam @NotBlank @Size(min = 3, message = "Logradouro precisa de no mínimo 3 caracteres") String logradouro) {
        return ResponseEntity.ok(viaCepService.searchAddresses(uf, cidade, logradouro));
    }
}