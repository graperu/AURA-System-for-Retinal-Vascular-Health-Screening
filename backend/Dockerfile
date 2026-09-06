# Multi-stage Dockerfile for Spring Boot Backend
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn package -DskipTests -B

# Production lightweight JRE runtime
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S aura && adduser -S aura -G aura
USER aura

COPY --from=build /app/target/*.jar app.jar
EXPOSE 8081

ENV JAVA_OPTS="-XX:+UseSerialGC -Xms128m -Xmx384m -Xss512k -XX:MaxRAMPercentage=75.0 -Dfile.encoding=UTF-8"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
