package com.brasilpanel.backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * Verifica que todo o contexto Spring sobe: beans, injeções, configuração de
 * segurança e cache. É o teste que pega erro de fiação antes do deploy.
 *
 * <p>Roda no perfil {@code test}, com H2 em memória, para não depender de um
 * PostgreSQL — que não existe no runner do CI.
 */
@SpringBootTest
@ActiveProfiles("test")
class BackendApplicationTests {

	@Test
	void contextLoads() {
	}

}
