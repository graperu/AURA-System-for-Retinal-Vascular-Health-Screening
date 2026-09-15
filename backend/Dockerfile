FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S aura && adduser -S aura -G aura
USER aura

COPY target/*.jar app.jar
EXPOSE 8081

ENV JAVA_OPTS="-XX:+UseG1GC -Xms256m -Xmx768m -XX:MaxRAMPercentage=75.0 -Dfile.encoding=UTF-8"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]

