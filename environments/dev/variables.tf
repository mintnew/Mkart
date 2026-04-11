variable "db_password" {
  type        = string
  sensitive   = true
}

variable "vpc_id" {
  type = string
}

variable "private_subnet_ids" {
  type = list(string)
}


variable "aws_region" {
  default = "us-east-1"
}

variable "environment" {
  default = "dev"
}