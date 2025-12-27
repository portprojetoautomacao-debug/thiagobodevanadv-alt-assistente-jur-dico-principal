FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app

# Copiar POM e baixar dependências (cache layer)
COPY pom.xml .
COPY mvnw .
COPY .mvn .mvn
RUN ./mvnw dependency:go-offline

# Copiar código e buildar
COPY src src
RUN ./mvnw clean package -DskipTests

# Stage final - runtime
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Copiar JAR do builder
COPY --from=builder /app/target/*.jar app.jar

# Habilitar Virtual Threads
ENV SPRING_THREADS_VIRTUAL_ENABLED=true

# Expor porta
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Executar
ENTRYPOINT ["java", "-XX:+UseZGC", "-XX:+ZGenerational", "-jar", "app.jar"]
