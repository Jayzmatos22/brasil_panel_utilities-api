package com.brasilpanel.backend.config.seed;

import com.brasilpanel.backend.model.Role;
import com.brasilpanel.backend.model.UserEntity;
import com.brasilpanel.backend.repository.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Cria o usuário administrador no startup se ainda não existir.
 *
 * Configure via variáveis de ambiente:
 *   ADMIN_EMAIL    — e-mail do admin  (ex: admin@brasilpanel.com)
 *   ADMIN_PASSWORD — senha do admin   (mín. 8 caracteres)
 *
 * Se ADMIN_PASSWORD não for fornecida, o seeder é ignorado com aviso.
 *
 * @Order(1) — roda antes dos seeders de dados estáticos.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@Order(1)
public class AdminSeeder implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email}")
    private String adminEmail;

    @Value("${app.admin.password:}")
    private String adminPassword;

    @Override
    public void run(ApplicationArguments args) {
        if (adminPassword == null || adminPassword.isBlank()) {
            log.warn("AdminSeeder: ADMIN_PASSWORD não configurada — admin NÃO foi criado. " +
                     "Defina a variável de ambiente ADMIN_PASSWORD para ativar.");
            return;
        }

        if (userRepository.findByEmail(adminEmail).isPresent()) {
            log.debug("AdminSeeder: admin '{}' já existe, pulando.", adminEmail);
            return;
        }

        UserEntity admin = UserEntity.builder()
                .name("Administrador")
                .email(adminEmail)
                .password(passwordEncoder.encode(adminPassword))
                .role(Role.ADMIN)
                .verified(true)   // admin não precisa verificar e-mail
                .build();

        userRepository.save(admin);
        log.info("AdminSeeder: admin '{}' criado com sucesso.", adminEmail);
    }
}