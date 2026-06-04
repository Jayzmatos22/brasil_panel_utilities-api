package com.brasilpanel.backend.service.email;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    /**
     * Envia o código de verificação para o e-mail do usuário.
     *
     * @param to   destinatário
     * @param code código de 6 dígitos gerado pelo AuthService
     */
    public void sendVerificationCode(String to, String code) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("Brasil Panel — Código de verificação");
            message.setText("""
                    Olá!

                    Seu código de verificação é:

                         %s

                    Ele expira em 15 minutos.

                    Se você não solicitou o cadastro no Brasil Panel, ignore este e-mail.
                    """.formatted(code));

            mailSender.send(message);
            log.info("EmailService: código de verificação enviado para '{}'.", to);

        } catch (Exception e) {
            log.error("EmailService: falha ao enviar e-mail para '{}': {}", to, e.getMessage());
            throw new RuntimeException("Falha ao enviar e-mail de verificação. Tente novamente.");
        }
    }
}