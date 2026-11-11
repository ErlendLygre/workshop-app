output "app_url" {
  description = "Public URL of the app."
  value       = startswith(scaleway_container.app.public_endpoint, "http") ? scaleway_container.app.public_endpoint : "https://${scaleway_container.app.public_endpoint}"
}

output "registry_endpoint" {
  description = "Registry to push the app image to."
  value       = scaleway_registry_namespace.main.endpoint
}

output "image_repository" {
  description = "Full image name, without tag."
  value       = "${scaleway_registry_namespace.main.endpoint}/${var.app_name}"
}
