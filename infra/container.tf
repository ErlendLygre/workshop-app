resource "scaleway_container_namespace" "main" {
  name = var.app_name
}

resource "scaleway_container" "app" {
  name         = var.app_name
  namespace_id = scaleway_container_namespace.main.id
  image        = "${scaleway_registry_namespace.main.endpoint}/${var.app_name}:${var.image_tag}"

  port                   = 8080
  protocol               = "http1"
  privacy                = "public"
  https_connections_only = true

  # Small and cheap: scale to zero when nobody is using it.
  cpu_limit          = 250
  memory_limit_bytes = 512 * 1024 * 1024
  min_scale          = 0
  max_scale          = 1

  secret_environment_variables = {
    "ConnectionStrings__Default" = local.connection_string
    "APP_PASSWORD"               = var.app_password
  }

  startup_probe {
    failure_threshold = 30
    interval          = "2s"
    timeout           = "2s"
    http {
      path = "/healthz"
    }
  }

  liveness_probe {
    failure_threshold = 3
    interval          = "30s"
    timeout           = "5s"
    http {
      path = "/healthz"
    }
  }

  # The database permissions must exist before the app starts and runs migrations.
  depends_on = [scaleway_iam_policy.app_db]
}
