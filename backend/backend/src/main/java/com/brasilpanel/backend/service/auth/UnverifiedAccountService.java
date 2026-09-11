package com.brasilpanel.backend.service.auth;

import com.brasilpanel.backend.repository.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Remove cadastros que nunca foram concluídos.
 *
 * <p>Quem se cadastra e não confirma o e-mail deixava um registro para sempre: nome
 * e endereço de uma pessoa que nunca virou usuária, guardados indefinidamente e sem
 * finalidade. Guardar dado pessoal além do necessário é problema por si só, e o
 * painel de admin ainda os listava junto com as contas de verdade.
 *
 * <p>Apagar também devolve o endereço: quem tentou se cadastrar, não recebeu o
 * código e desistiu consegue tentar de novo depois do prazo, em vez de esbarrar
 * para sempre em "e-mail já cadastrado".
 *
 * <p>O prazo é generoso de propósito. Não é um mecanismo de segurança com janela
 * apertada, é higiene de retenção: precisa cobrir com folga quem só vai abrir o
 * e-mail no fim de semana.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UnverifiedAccountService {

    private final UserRepository userRepository;

    /**
     * @param diasDeRetencao idade mínima, em dias, para um cadastro não verificado ser apagado
     * @return quantos registros foram removidos
     */
    @Transactional
    public int purge(int diasDeRetencao) {
        LocalDateTime limite = LocalDateTime.now().minusDays(diasDeRetencao);
        return userRepository.deleteNaoVerificadosCriadosAntesDe(limite);
    }
}
