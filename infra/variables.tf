variable "project_id" {
  description = "Scaleway project ID to deploy into."
  type        = string
}

variable "region" {
  description = "Scaleway region."
  type        = string
  default     = "fr-par"
}

variable "app_name" {
  description = "Name used for all resources."
  type        = string
  default     = "home-library"
}

variable "image_tag" {
  description = "Tag of the app image in the registry (CI passes the git commit SHA)."
  type        = string
  default     = "latest"
}

variable "app_password" {
  description = "Password used to log in to the app."
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.app_password) >= 12
    error_message = "Use an app password of at least 12 characters."
  }
}
