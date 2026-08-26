FROM eclipse-temurin:21-jdk-alpine AS build

WORKDIR /app

COPY pom.xml ./

COPY src ./src

RUN apk add --no-cache maven

RUN mvn clean package -DskipTests


FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

COPY --from=build /app/target/aura-ai-service-0.1.0-SNAPSHOT.jar app.jar

EXPOSE 8000

ENTRYPOINT ["java", "-jar", "app.jar"]