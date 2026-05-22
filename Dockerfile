FROM maven:3.9-eclipse-temurin-17 AS build
ARG OTEL_JAVA_AGENT_VERSION=2.10.0
WORKDIR /workspace

COPY pom.xml .
RUN mvn -B dependency:go-offline
RUN mvn -B org.apache.maven.plugins:maven-dependency-plugin:3.8.1:copy \
    -Dartifact=io.opentelemetry.javaagent:opentelemetry-javaagent:${OTEL_JAVA_AGENT_VERSION}:jar \
    -DoutputDirectory=/workspace/otel \
    -Dmdep.stripVersion=true

COPY src ./src
RUN mvn -B package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app

RUN useradd --system --create-home --uid 10001 appuser
COPY --from=build /workspace/target/*.jar /app/app.jar
COPY --from=build /workspace/otel/opentelemetry-javaagent.jar /app/opentelemetry-javaagent.jar
ENV OTEL_SEMCONV_STABILITY_OPT_IN=http \
    OTEL_TRACES_EXPORTER=otlp \
    OTEL_METRICS_EXPORTER=otlp \
    OTEL_LOGS_EXPORTER=none \
    OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf

USER appuser
EXPOSE 8080

ENTRYPOINT ["java", "-javaagent:/app/opentelemetry-javaagent.jar", "-jar", "/app/app.jar"]
