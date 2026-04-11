terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

    backend "s3" {
    bucket = "cloud-native-terraform-state-v101"
    key = "ecommerce101/terraform.tfstate"
    region = "us-east-1"
    dynamodb_endpoint = "terraform-locks"
    encrypt = true
  }
}