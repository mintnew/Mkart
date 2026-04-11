terraform {
  backend "s3" {
    bucket = "cloud-native-terraform-state-v101"
    key = "dev/terraform.tfstate"
    region = "us-east-1"
    dynamodb_endpoint = "terraform-locks"
    encrypt = true
  }
}