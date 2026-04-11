variable "name" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "private_subnet_ids" {
  type = list(string)
}

variable "allowed_cidr_blocks" {
  type    = list(string)
  default = ["10.0.0.0/16"]
}

variable "engine_version" {
  default = "15"
}

variable "instance_class" {
  default = "db.t3.micro"
}

variable "allocated_storage" {
  default = 20
}

variable "db_name" {
  type = string
}

variable "username" {
  default = "postgres"
}

variable "password" {
  type      = string
  sensitive = true
}

variable "backup_retention" {
  default = 7
}