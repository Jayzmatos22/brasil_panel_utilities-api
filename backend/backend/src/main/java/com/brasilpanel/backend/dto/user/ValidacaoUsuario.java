package com.brasilpanel.backend.dto.user;

/**
 * Regras de nome e senha usadas pelas anotações de validação.
 *
 * <p>Constantes num lugar só porque três DTOs precisam da mesma exigência de senha —
 * cadastro, troca e redefinição. Repetir a expressão nos três a deixaria livre para
 * divergir, que é exatamente o que aconteceu no frontend: o cadastro pedia composição
 * forte e as outras duas telas se contentavam com oito caracteres, então dava para
 * definir uma senha fraca pela recuperação e contornar a exigência do cadastro.
 */
public final class ValidacaoUsuario {

    private ValidacaoUsuario() {}

    /**
     * Oito caracteres com maiúscula, minúscula, número e um símbolo — qualquer símbolo.
     *
     * <p>O quarto requisito é {@code [^A-Za-z\d]}, "não é letra nem dígito", e não uma
     * lista de símbolos permitidos. Listar quais valem é o erro que estava no frontend:
     * ele aceitava só {@code @$!%*?&}, então {@code Senha#Forte1} era recusada por conter
     * {@code #} — justamente o tipo de senha que um gerenciador gera.
     */
    public static final String SENHA_FORTE =
            "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d]).{8,}$";

    public static final String SENHA_FRACA =
            "Senha fraca. Use ao menos 8 caracteres, com maiúscula, minúscula, número e um símbolo.";

    /**
     * Nome: letras, com espaço, hífen e apóstrofo, no mínimo três letras.
     *
     * <p>Sobrenome não é exigido. Recusar "Ana" não protegia nada e travava gente
     * legítima na porta; o que resta é um piso contra digitação acidental.
     *
     * <p>O {@code {3,}} do primeiro grupo garante as três letras sem precisar contá-las
     * à parte: caracteres de ligação só aparecem depois delas.
     */
    public static final String NOME =
            "^\\p{L}{3,}[\\p{L}'’\\- ]*$";

    public static final String NOME_INVALIDO = "Informe seu nome (mínimo 3 letras).";
}
