# Home Library

A small personal app for keeping track of the books you own: add books, remove them, and mark them as read or unread.

- **Frontend:** React + TypeScript (Vite)
- **Backend:** ASP.NET Core minimal API (.NET 10) with EF Core
- **Database:** PostgreSQL (Scaleway Serverless SQL Database in production)
- **Hosting:** one Scaleway Serverless Container that serves both the API and the React app
- **Infrastructure:** OpenTofu (`infra/`), deployed by GitHub Actions

The app is protected by a single password (the `APP_PASSWORD` setting). After logging in you get a cookie that is valid for 30 days.

```
backend/   .NET API + tests
frontend/  React app
infra/     OpenTofu config for Scaleway
.github/   CI (pull requests) and deployment (push to main)
```

## Run locally

You need Docker.

```bash
docker compose up --build
```

Open http://localhost:8080 and log in with `dev-password`.

### Developing with hot reload

You need the .NET 10 SDK and Node.js 22. Start only the database with Docker:

```bash
docker compose up -d db
```

Start the API on http://localhost:8080. It uses `appsettings.Development.json`, where the password is `dev-password`:

```bash
cd backend/HomeLibrary.Api && dotnet run
```

In another terminal, start the frontend on http://localhost:5173. It forwards `/api` to the backend:

```bash
cd frontend && npm install && npm run dev
```

### Tests

```bash
dotnet test backend/HomeLibrary.slnx
```

```bash
cd frontend && npm run lint && npm run build
```

### Changing the database schema

Edit the models in `backend/HomeLibrary.Api/Models`, then add a migration. Migrations are applied automatically when the app starts.

```bash
cd backend && dotnet tool restore && cd HomeLibrary.Api && APP_PASSWORD=x dotnet ef migrations add <Name>
```

## Deploy to Scaleway

Every push to `main` runs the tests, builds the Docker image, pushes it to Scaleway Container Registry and runs `tofu apply`. OpenTofu creates or updates:

| Resource | What it is |
|---|---|
| `scaleway_registry_namespace` | Private registry for the app image |
| `scaleway_sdb_sql_database` | Serverless PostgreSQL database (scales to zero) |
| `scaleway_iam_application` + policy + API key | Database credentials for the app (Serverless SQL Database uses IAM for login) |
| `scaleway_container_namespace` + `scaleway_container` | The app (512 MB, 0.25 vCPU, scales between 0 and 1 instances) |

Because both the container and the database scale to zero, the first request after a quiet period takes a few seconds.

### One-time setup

Do these steps once, in the [Scaleway console](https://console.scaleway.com) or with the `scw` CLI.

**1. Create an API key for GitHub Actions.**

Go to *IAM → Applications*, create an application such as `github-deploy`, and give it a policy with these rules:

- Scope: your project. Permission sets: `ContainersFullAccess`, `ContainerRegistryFullAccess`, `ServerlessSQLDatabaseFullAccess`, `ObjectStorageFullAccess`.
- Scope: organization. Permission sets: `IAMManager` and `ProjectReadOnly`. These let OpenTofu create the app's own database credentials.

Then create an API key for the application. Note the access key and the secret key. Set its *preferred Object Storage project* to your project.

**2. Create a bucket for the OpenTofu state.**

The name must be unique across all of Scaleway. Enabling versioning is a good idea, because it lets you recover the state if something goes wrong.

```bash
scw object bucket create name=<your-state-bucket> region=fr-par
```

**3. Add GitHub settings.**

Add these under *Settings → Secrets and variables → Actions* in this repository:

| Type | Name | Value |
|---|---|---|
| Secret | `SCW_ACCESS_KEY` | Access key from step 1 |
| Secret | `SCW_SECRET_KEY` | Secret key from step 1 |
| Secret | `SCW_DEFAULT_PROJECT_ID` | Your Scaleway project ID |
| Secret | `APP_PASSWORD` | The password you will log in with (at least 12 characters) |
| Variable | `TF_STATE_BUCKET` | Bucket name from step 2 |

**4. Push to `main`, or run the *Deploy* workflow manually.**

The app URL is shown in the workflow summary. You can also get it from OpenTofu:

```bash
tofu output app_url
```

### Running OpenTofu from your own machine

```bash
cd infra
```

```bash
export SCW_ACCESS_KEY=... SCW_SECRET_KEY=...
```

```bash
export AWS_ACCESS_KEY_ID=$SCW_ACCESS_KEY AWS_SECRET_ACCESS_KEY=$SCW_SECRET_KEY
```

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` and set `project_id` and `app_password`. Then initialize OpenTofu:

```bash
tofu init -backend-config="bucket=<your-state-bucket>"
```

Check what will change. Pass the image tag that is currently deployed:

```bash
tofu plan -var="image_tag=<deployed git sha>"
```

### Changing the password

Update the `APP_PASSWORD` secret in GitHub and run the *Deploy* workflow again.
