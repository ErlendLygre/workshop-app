# syntax=docker/dockerfile:1

# 1. Build the React frontend
FROM node:22-alpine AS frontend
WORKDIR /src
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# 2. Build the .NET API
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS backend
WORKDIR /src
COPY backend/HomeLibrary.Api/HomeLibrary.Api.csproj HomeLibrary.Api/
RUN dotnet restore HomeLibrary.Api/HomeLibrary.Api.csproj
COPY backend/HomeLibrary.Api/ HomeLibrary.Api/
RUN dotnet publish HomeLibrary.Api/HomeLibrary.Api.csproj -c Release -o /app --no-restore

# 3. Runtime image: the API serves the built frontend from wwwroot
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=backend /app ./
COPY --from=frontend /src/dist ./wwwroot
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080
USER $APP_UID
ENTRYPOINT ["dotnet", "HomeLibrary.Api.dll"]
