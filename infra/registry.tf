# Private container registry for the app image.
# Serverless Containers in the same project can pull from it without extra credentials.
# Registry names are unique across all of Scaleway, so a project-specific suffix is added.
resource "scaleway_registry_namespace" "main" {
  name      = "${var.app_name}-${substr(var.project_id, 0, 8)}"
  is_public = false
}
