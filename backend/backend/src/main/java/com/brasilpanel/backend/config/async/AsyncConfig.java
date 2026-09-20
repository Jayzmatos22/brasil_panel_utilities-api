package com.brasilpanel.backend.config.async;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/**
 * Executor para o envio de e-mail disparado por evento.
 *
 * <p>Existe para o drain do outbox sair da thread da requisição: o usuário não deve
 * esperar o handshake SMTP para receber a resposta do cadastro.
 *
 * <p><b>Pool pequeno de propósito.</b> O trabalho aqui é esperar rede, não calcular,
 * e o volume é o de cadastros de um painel — não o de uma newsletter. Um pool grande
 * só abriria mais conexões simultâneas no banco e no SMTP sem entregar nada mais
 * rápido.
 *
 * <p><b>CallerRuns na saturação.</b> Se a fila encher, quem chamou executa o envio
 * na própria thread em vez de a tarefa ser descartada. Fica mais lento, e é o que se
 * quer: perder silenciosamente um e-mail de verificação deixa o usuário travado na
 * tela sem código, sem nada no log dizendo por quê.
 */
@Configuration
@EnableAsync
public class AsyncConfig {

    public static final String EMAIL_EXECUTOR = "emailExecutor";

    @Bean(EMAIL_EXECUTOR)
    public Executor emailExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(1);
        executor.setMaxPoolSize(2);
        executor.setQueueCapacity(50);
        executor.setThreadNamePrefix("outbox-");
        executor.setRejectedExecutionHandler(
                new java.util.concurrent.ThreadPoolExecutor.CallerRunsPolicy());
        executor.initialize();
        return executor;
    }
}
