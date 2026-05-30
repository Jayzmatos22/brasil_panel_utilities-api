package com.brasilpanel.backend.validators.api;
import com.brasilpanel.backend.exception.customized.IbgeException;
import org.springframework.stereotype.Component;

import java.util.Set;


@Component
public class IbgeValidator {

    // Id oficial de cada estado.
    public static final Set<Integer> VALID_STATE_IDS = Set.of(
            11, 12, 13, 14, 15, 16, 17,
            21, 22, 23, 24, 25, 26, 27, 28, 29,
            31, 32, 33, 35,
            41, 42, 43,
            50, 51, 52, 53
    );

    // SIglas
    public static final Set<String> VALID_STATE_SIGLAS = Set.of(
            "RO","AC","AM","RR","PA","AP","TO",
            "MA","PI","CE","RN","PB","PE","AL","SE","BA",
            "MG","ES","RJ","SP",
            "PR","SC","RS",
            "MS","MT","GO","DF"
    );


    public String resolveStateUri(String state) {
        // Obs, este validator não faz requisição, apenas monta url com adequação de parâmetros.
        String base = "https://servicodados.ibge.gov.br/api/v1/localidades/estados/{state}/municipios";

        try {
            int id = Integer.parseInt(state);
            if (!VALID_STATE_IDS.contains(id)) {
                throw new IbgeException("ID de estado inválido: " + id, 400);
            }
            return base.replace("{state}", String.valueOf(id));
        } catch (NumberFormatException e) {
            String sigla = state.toUpperCase().trim();
            if (!VALID_STATE_SIGLAS.contains(sigla)) {
                throw new IbgeException("Sigla de estado inválida: " + sigla, 400);
            }
            return base.replace("{state}", sigla);
        }
    }
}
