package com.brasilpanel.backend.service.userDetails;

import com.brasilpanel.backend.repository.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    /**
     * Mensagem fixa, sem ecoar o e-mail consultado.
     *
     * <p>Hoje o {@code DaoAuthenticationProvider} esconde esta exceção por padrão
     * ({@code hideUserNotFoundExceptions}), então o endereço não chega ao cliente. A
     * proteção depende inteiramente daquele padrão continuar ligado: se alguém trocar
     * o provider ou desligar a opção, a mensagem vira oráculo de cadastro sem que
     * ninguém tenha tocado nesta classe.
     */
    private static final String USUARIO_NAO_ENCONTRADO = "Credenciais inválidas";

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(USUARIO_NAO_ENCONTRADO));
    }
}
