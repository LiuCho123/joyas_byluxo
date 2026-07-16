# 1. Etapa de Construcción: Instalamos Maven y Java 21 para compilar tu código
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
# Copiamos las configuraciones y el código fuente
COPY pom.xml .
COPY src ./src
# Compilamos el proyecto ignorando los tests para que sea más rápido
RUN mvn clean package -DskipTests

# 2. Etapa de Ejecución: Un servidor limpio solo con Java 21 para correr la app
FROM eclipse-temurin:21-jdk-jammy
WORKDIR /app
# Traemos el archivo .jar ya compilado de la etapa anterior
COPY --from=build /app/target/*.jar app.jar

# Exponemos el puerto de Spring Boot
EXPOSE 8080

# Comando para encender el servidor
ENTRYPOINT ["java", "-jar", "app.jar"]