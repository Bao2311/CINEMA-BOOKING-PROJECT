# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj files and restore
COPY STP.Repository/STP.Repository.csproj STP.Repository/
COPY STP.APIService/STP.APIService.csproj STP.APIService/
RUN dotnet restore STP.APIService/STP.APIService.csproj

# Copy everything and build
COPY . .
RUN dotnet publish STP.APIService/STP.APIService.csproj -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

# Install native dependencies for DinkToPdf/wkhtmltopdf
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgdiplus \
    libc6-dev \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/publish .

# Expose port
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "STP.APIService.dll"]
