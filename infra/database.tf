# Serverless SQL Database: PostgreSQL-compatible, scales to zero when idle.
resource "scaleway_sdb_sql_database" "main" {
  name    = var.app_name
  min_cpu = 0
  max_cpu = 2
}

data "scaleway_account_project" "current" {
  project_id = var.project_id
}

# Serverless SQL Database authenticates with IAM: the app gets its own
# IAM application whose API key is used as the database username/password.
resource "scaleway_iam_application" "app" {
  name            = "${var.app_name}-app"
  description     = "Used by the ${var.app_name} container to access its database."
  organization_id = data.scaleway_account_project.current.organization_id
}

resource "scaleway_iam_policy" "app_db" {
  name            = "${var.app_name}-database-access"
  application_id  = scaleway_iam_application.app.id
  organization_id = data.scaleway_account_project.current.organization_id

  rule {
    project_ids          = [var.project_id]
    permission_set_names = ["ServerlessSQLDatabaseReadWrite"]
  }
}

resource "scaleway_iam_api_key" "app" {
  application_id     = scaleway_iam_application.app.id
  default_project_id = var.project_id
  description        = "Database credentials for the ${var.app_name} container."
}

locals {
  # The endpoint looks like postgres://<host>:<port>/<database>?sslmode=require
  db = regex("^postgres(?:ql)?://([^:/]+):(\\d+)/([^?]+)", scaleway_sdb_sql_database.main.endpoint)

  connection_string = join(";", [
    "Host=${local.db[0]}",
    "Port=${local.db[1]}",
    "Database=${local.db[2]}",
    "Username=${scaleway_iam_application.app.id}",
    "Password=${scaleway_iam_api_key.app.secret_key}",
    "SSL Mode=Require",
  ])
}
