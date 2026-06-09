FROM eclipse-temurin:17-jdk-alpine AS builder
WORKDIR /app
COPY V2/springboot .
RUN ./mvnw clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/linksaver-backend-1.0.0.jar .
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "linksaver-backend-1.0.0.jar"]
