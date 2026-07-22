FROM maven:3.9.9-eclipse-temurin-21-alpine AS build
WORKDIR /workspace
COPY pom.xml .
COPY src ./src
RUN mvn -B package

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S aura && adduser -S aura -G aura
COPY --from=build /workspace/target/backend-0.0.1-SNAPSHOT.jar app.jar
USER aura
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
