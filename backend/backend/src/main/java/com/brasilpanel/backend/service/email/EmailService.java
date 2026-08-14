package com.brasilpanel.backend.service.email;

import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.UnsupportedEncodingException;

@Service
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    // Remetente configurável via app.mail.* (independente do username SMTP)
    @Value("${app.mail.from-address}")
    private String fromAddress;

    @Value("${app.mail.from-name}")
    private String fromName;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Envia o código de verificação em um e-mail HTML estilizado.
     *
     * @param to   destinatário
     * @param code código de 6 dígitos
     */
    public void sendVerificationCode(String to, String code) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            // multipart = true: sem isso o helper monta um text/html solo, e
            // mensagem transacional sem alternativa em texto puro é sinal
            // clássico de filtro de spam. Ver setText(plain, html) abaixo.
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromAddress, fromName);
            helper.setTo(to);
            helper.setSubject("Seu código de verificação — Brasil Panel");
            // A ordem importa: o primeiro argumento é o texto puro, o segundo o
            // HTML. O cliente de e-mail escolhe, e o filtro vê os dois.
            helper.setText(buildPlainText(code), buildHtml(code));

            mailSender.send(message);
            log.info("EmailService: código de verificação enviado para '{}'.", to);

        } catch (Exception e) {
            log.error("EmailService: falha ao enviar e-mail para '{}': {}", to, e.getMessage());
            throw new RuntimeException("Falha ao enviar e-mail de verificação. Tente novamente.");
        }
    }

    /**
     * Versão em texto puro, enviada junto do HTML como alternativa.
     *
     * <p>Não é decorativa: é ela que o cliente sem HTML exibe, e é a ausência
     * dela que faz uma mensagem transacional parecer disparo automático para o
     * filtro. Precisa conter a mesma informação essencial do HTML — o código e o
     * prazo —, senão vira ruído e piora o sinal em vez de melhorar.
     */
    private String buildPlainText(String code) {
        return """
               Brasil Panel — confirme seu e-mail

               Use o código abaixo para concluir seu cadastro.
               Ele é válido por 15 minutos.

                   %s

               Se você não solicitou este cadastro, pode ignorar este e-mail
               com segurança.

               Este é um e-mail automático, não responda.
               """.formatted(code);
    }

    /** Monta o corpo HTML do e-mail com as cores e identidade do Brasil Panel. */
    private String buildHtml(String code) {
        return """
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
            <body style="margin:0;padding:0;background-color:#020617;font-family:Arial,Helvetica,sans-serif;">
              <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="background-color:#020617;padding:40px 16px;">
                <tr>
                  <td align="center">
                    <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#0f172a;border:1px solid #1e293b;border-radius:16px;overflow:hidden;">

                      <!-- Cabeçalho com logo -->
                      <tr>
                        <td style="padding:32px 32px 24px;text-align:center;border-bottom:1px solid #1e293b;">
                          <div style="display:inline-block;width:48px;height:48px;line-height:48px;border-radius:12px;background-color:#f59e0b;color:#020617;font-size:24px;font-weight:bold;">B</div>
                          <div style="margin-top:12px;font-size:20px;font-weight:bold;color:#ffffff;">Brasil&nbsp;Panel</div>
                          <div style="font-size:12px;color:#64748b;margin-top:4px;">Painel de indicadores econômicos do Brasil</div>
                        </td>
                      </tr>

                      <!-- Corpo -->
                      <tr>
                        <td style="padding:32px;">
                          <h1 style="margin:0 0 12px;font-size:20px;color:#ffffff;">Confirme seu e-mail</h1>
                          <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#94a3b8;">
                            Use o código abaixo para concluir seu cadastro. Ele é válido por
                            <strong style="color:#f59e0b;">15 minutos</strong>.
                          </p>

                          <!-- Caixa do código -->
                          <div style="text-align:center;margin:0 0 24px;">
                            <div style="display:inline-block;padding:16px 32px;background-color:#1e293b;border:1px solid #334155;border-radius:12px;">
                              <span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#fbbf24;font-family:'Courier New',monospace;">%s</span>
                            </div>
                          </div>

                          <p style="margin:0;font-size:12px;line-height:1.6;color:#64748b;">
                            Se você não solicitou este cadastro, pode ignorar este e-mail com segurança.
                          </p>
                        </td>
                      </tr>

                      <!-- Rodapé -->
                      <tr>
                        <td style="padding:20px 32px;border-top:1px solid #1e293b;text-align:center;">
                          <p style="margin:0;font-size:11px;color:#475569;">
                            © Brasil Panel — Este é um e-mail automático, não responda.
                          </p>
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """.formatted(code);
    }
}