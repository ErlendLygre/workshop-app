terraform {
  required_version = ">= 1.8"

  required_providers {
    scaleway = {
      source  = "scaleway/scaleway"
      version = "~> 2.91"
    }
  }

  # State lives in a Scaleway Object Storage bucket (S3-compatible).
  # The bucket name is passed at init time: tofu init -backend-config="bucket=<name>"
  # Credentials come from AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY (= your Scaleway API key).
  backend "s3" {
    key    = "home-library/terraform.tfstate"
    region = "fr-par"
    endpoints = {
      s3 = "https://s3.fr-par.scw.cloud"
    }
    use_path_style              = true
    skip_credentials_validation = true
    skip_region_validation      = true
    skip_requesting_account_id  = true
    skip_metadata_api_check     = true
    skip_s3_checksum            = true
  }
}

# Credentials come from SCW_ACCESS_KEY / SCW_SECRET_KEY.
provider "scaleway" {
  region     = var.region
  project_id = var.project_id
}
