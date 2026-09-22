# syntax=docker/dockerfile:1
# Stage 1: Build JAR with BuildKit cache mount for Maven dependencies
FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder
WORKDIR /app

# 1. Tách layer pom.xml và pre-fetch dependencies của dự án
COPY pom.xml ./
RUN --mount=type=cache,target=/root/.m2 \
    mvn dependency:resolve -B

# 2. Copy source code và compile tái sử dụng cache .m2
COPY src ./src
RUN --mount=type=cache,target=/root/.m2 \
    mvn package -DskipTests -B

# Stage 2: Minimal Runtime Image
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S aura && adduser -S aura -G aura
USER aura

COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8081

ENV JAVA_OPTS="-XX:+UseG1GC -Xms256m -Xmx768m -XX:MaxRAMPercentage=75.0 -Dfile.encoding=UTF-8"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]


