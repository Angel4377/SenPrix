# ────────────────────────────────────────────────
# Stage 1 : Build avec Maven
# ────────────────────────────────────────────────
FROM maven:3.9.6-eclipse-temurin-17-alpine AS builder

WORKDIR /build

# Copier uniquement le pom.xml en premier pour profiter du cache des layers
COPY pom.xml .
RUN mvn dependency:go-offline -q

# Copier le code source et compiler
COPY src ./src
RUN mvn package -DskipTests -q

# ────────────────────────────────────────────────
# Stage 2 : Image finale légère (JRE uniquement)
# ────────────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine

LABEL maintainer="DCI Sénégal <marketwatch@dci.sn>"
LABEL app="marketwatch-backend"
LABEL version="1.0.0"

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -S marketwatch && adduser -S marketwatch -G marketwatch

WORKDIR /app

# Copier le JAR depuis le stage builder
COPY --from=builder /build/target/*.jar app.jar

# Changer le propriétaire du fichier
RUN chown marketwatch:marketwatch app.jar

USER marketwatch

# Port de l'API Spring Boot
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:8080/actuator/health || exit 1

# Lancement avec profil de production
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-Dspring.profiles.active=prod", \
  "-jar", "app.jar"]
