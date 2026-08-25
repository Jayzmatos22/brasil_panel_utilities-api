# Build e execução em estágios separados.
#
# Existe porque o Render não oferece runtime Java nativo: sem Dockerfile não há
# como publicar este serviço lá. Mas o ganho não é só esse — a imagem fixa a
# versão do Java. O pom exige 21 (<java.version>21</java.version>), e um JRE 17
# faria a aplicação morrer no boot com UnsupportedClassVersionError, cuja
# mensagem não aponta para a causa.
#
# A ordem das camadas não é estética: o pom.xml é copiado e resolvido ANTES do
# código-fonte, então alterar src/ não invalida o cache das dependências. Sem
# isso, todo deploy rebaixaria o Maven inteiro.

# ── Estágio 1: build ─────────────────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /build

# Só o pom primeiro: esta camada só é refeita quando as dependências mudam.
COPY pom.xml ./
RUN mvn -B -q dependency:go-offline

COPY src ./src
RUN mvn -B clean package -DskipTests

# ── Estágio 2: execução ──────────────────────────────────────────────────────
# JRE, não JDK: a imagem final não precisa de compilador, e o que não está na
# imagem não precisa ser corrigido quando sair CVE.
FROM eclipse-temurin:21-jre AS runtime

WORKDIR /app

# Usuário sem privilégios. Nada aqui precisa de root, e um processo comprometido
# não deve conseguir escrever no sistema de arquivos da própria imagem.
RUN useradd --system --create-home --shell /usr/sbin/nologin brasilpanel \
    && chown brasilpanel:brasilpanel /app

# Nome fixo, sem a versão: o comando de start não muda a cada bump do pom.
# O padrão backend-*.jar não casa com o backend-*.jar.original que o
# spring-boot-maven-plugin deixa ao reempacotar.
COPY --from=build --chown=brasilpanel:brasilpanel /build/target/backend-*.jar app.jar

USER brasilpanel

# O Render injeta PORT e espera o serviço escutando nela; o application.yaml usa
# ${PORT:8080}. Este default só vale ao rodar a imagem fora do Render.
ENV PORT=8080
EXPOSE 8080

# MaxRAMPercentage porque o default da JVM em container é 25% da memória
# disponível: num plano de 512 MB isso deixa mais de 300 MB ociosos e provoca
# OOM sob carga que caberia folgada.
#
# Forma exec (sem shell): a JVM vira PID 1 e recebe o SIGTERM do Render
# diretamente, então o desligamento gracioso do Spring acontece de verdade. Com
# "sh -c" o sinal morre no shell e o processo é morto à força.
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
