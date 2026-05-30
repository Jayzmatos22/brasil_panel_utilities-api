package com.brasilpanel.backend.controller.api;

import com.brasilpanel.backend.dto.api.viaCep.ViaCepResponseDTO;
import com.brasilpanel.backend.service.api.viaCep.ViaCepService;
import com.brasilpanel.backend.validators.annotations.ValidCep;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RequestMapping("/api/viacep")
@RestController
@RequiredArgsConstructor
public class ViaCepController {

    private final ViaCepService viaCepService;


    @Operation(summary = "Buscar endereço pelo cep",
            description = "Busca endereço complemento com campos: " +
            "String cep, \n" +
            "String logradouro, \n" +
            "String complemento, \n" +
            "String bairro, \n" +
            "String localidade, \n" +
            "String uf, \n" +
            "String estado, \n" +
            "String ddd ")
    @ApiResponse(responseCode = "200", description = "Retorna o endereço pelo cep")
    @ApiResponse(responseCode = "502", description = "Erro desconhecido na comunicação com a API ViaCep")
    @GetMapping("/{cep}")
    public ResponseEntity<ViaCepResponseDTO> getAddress(@PathVariable @ValidCep String cep){
        return ResponseEntity.ok(viaCepService.getAdressByCep(cep));
    }
}
