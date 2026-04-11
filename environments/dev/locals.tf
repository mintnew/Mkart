locals {
  db_creds = jsondecode(data.aws_secretsmanager_secret_version.db_value.secret_string)
}