package com.brasilpanel.backend.service.email;

import jakarta.mail.internet.MimeMessage;
import jakarta.mail.internet.MimeMultipart;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * O e-mail de verificação vinha caindo no spam do Gmail. Um dos sinais era
 * estrutural: a mensagem saía como {@code text/html} solo, sem alternativa em
 * texto puro, o que é padrão de disparo automático para os filtros.
 *
 * <p>Estes testes prendem a estrutura MIME. Eles não provam entrega — isso
 * depende de domínio verificado e reputação do remetente, que não são código.
 */
@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    private static final String DESTINATARIO = "usuario@exemplo.com";
    private static final String CODIGO = "123456";

    @Mock private JavaMailSender mailSender;

    private EmailService emailService;

    @BeforeEach
    void setUp() {
        emailService = new EmailService(mailSender);
        // Os campos vêm de @Value; sem contexto Spring, injetamos direto.
        ReflectionTestUtils.setField(emailService, "fromAddress", "brasilpanel.app@gmail.com");
        ReflectionTestUtils.setField(emailService, "fromName", "Brasil Panel");
    }

    /** MimeMessage real: montá-lo é o que exercita o MimeMessageHelper. */
    private MimeMessage mensagemReal() {
        return new JavaMailSenderImpl().createMimeMessage();
    }

    private MimeMessage capturarEnviada() {
        ArgumentCaptor<MimeMessage> captor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(mailSender).send(captor.capture());
        return captor.getValue();
    }

    /** Concatena as partes de texto da mensagem, seja qual for o aninhamento. */
    private static String textoDe(Object conteudo) throws Exception {
        if (conteudo instanceof String texto) {
            return texto;
        }
        if (conteudo instanceof MimeMultipart multipart) {
            StringBuilder acumulado = new StringBuilder();
            for (int i = 0; i < multipart.getCount(); i++) {
                acumulado.append(textoDe(multipart.getBodyPart(i).getContent()));
            }
            return acumulado.toString();
        }
        return "";
    }

    /**
     * Procura um {@code multipart/alternative} em qualquer profundidade.
     *
     * <p>O Spring monta a árvore como mixed → related → alternative, então olhar
     * só a raiz encontraria "mixed" e não responderia a pergunta. E não dá para
     * usar {@code getContentType()} da mensagem: o cabeçalho só é materializado
     * no {@code saveChanges()}, que roda dentro do {@code send()} — mockado aqui.
     * Sem isso ele responde "text/plain" mesmo com a árvore montada.
     */
    private static boolean temAlternativa(Object conteudo) throws Exception {
        if (!(conteudo instanceof MimeMultipart multipart)) {
            return false;
        }
        if (multipart.getContentType().toLowerCase().contains("alternative")) {
            return true;
        }
        for (int i = 0; i < multipart.getCount(); i++) {
            if (temAlternativa(multipart.getBodyPart(i).getContent())) {
                return true;
            }
        }
        return false;
    }

    @Test
    @DisplayName("mensagem oferece alternativa em texto puro, não HTML solo")
    void messageOffersPlainTextAlternative() throws Exception {
        when(mailSender.createMimeMessage()).thenReturn(mensagemReal());

        emailService.sendVerificationCode(DESTINATARIO, CODIGO);

        // O sinal que motivou a mudança: text/html sozinho, sem alternativa.
        assertThat(temAlternativa(capturarEnviada().getContent())).isTrue();
    }

    @Test
    @DisplayName("o código aparece nas duas versões, texto puro e HTML")
    void codeAppearsInBothAlternatives() throws Exception {
        when(mailSender.createMimeMessage()).thenReturn(mensagemReal());

        emailService.sendVerificationCode(DESTINATARIO, CODIGO);

        String corpo = textoDe(capturarEnviada().getContent());

        // Uma alternativa em texto puro que não carregue o código deixaria o
        // leitor sem HTML sem conseguir concluir o cadastro.
        assertThat(corpo).contains(CODIGO);
        // Marcação exclusiva do HTML e frase exclusiva do texto puro: se uma
        // sumir, a mensagem voltou a ter só uma versão.
        assertThat(corpo).contains("<!DOCTYPE html>");
        assertThat(corpo).contains("Brasil Panel — confirme seu e-mail");
    }

    @Test
    @DisplayName("destinatário e remetente configurável chegam à mensagem")
    void recipientAndConfiguredSenderAreSet() throws Exception {
        when(mailSender.createMimeMessage()).thenReturn(mensagemReal());

        emailService.sendVerificationCode(DESTINATARIO, CODIGO);

        MimeMessage enviada = capturarEnviada();
        assertThat(enviada.getAllRecipients()[0].toString()).isEqualTo(DESTINATARIO);
        // O remetente vem de app.mail.from-address, e não do usuário SMTP: num
        // provedor que exige domínio verificado, os dois podem divergir.
        assertThat(enviada.getFrom()[0].toString()).contains("brasilpanel.app@gmail.com");
    }

    @Test
    @DisplayName("falha no envio vira erro de aplicação, sem vazar detalhe de SMTP")
    void sendFailureBecomesApplicationError() {
        when(mailSender.createMimeMessage()).thenReturn(mensagemReal());
        doThrow(new MailSendException("535 5.7.8 Username and Password not accepted"))
                .when(mailSender).send(any(MimeMessage.class));

        assertThatThrownBy(() -> emailService.sendVerificationCode(DESTINATARIO, CODIGO))
                .isInstanceOf(RuntimeException.class)
                // O texto do servidor SMTP não pode chegar ao cliente.
                .hasMessageNotContaining("535")
                .hasMessageContaining("Falha ao enviar");
    }
}
