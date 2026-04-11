module "vpc" {
  source = "../../modules/vpc"

  vpc_cidr        = "10.0.0.0/16"
  public_subnets  = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnets = ["10.0.3.0/24", "10.0.4.0/24"]
  azs             = ["us-east-1a", "us-east-1b"]
}

module "eks" {
  source = "../../modules/eks"

  cluster_name    = "dev-eks-cluster"
  vpc_id          = module.vpc.vpc_id
  private_subnets = module.vpc.private_subnets
  public_subnets  = module.vpc.public_subnets
  region          = var.aws_region
}

module "rds" {
  source = "../../modules/rds"

  name               = "ecommerce-db"
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnets

  db_name  = "productdb"
  username = "postgres"

  password = data.aws_secretsmanager_secret_version.db_password.secret_string

  allowed_cidr_blocks = ["10.0.0.0/16"]
}

module "github_oidc" {
  source = "../../modules/iam"

  github_repo   = "mintnew/Mkart"
  github_branch = "main"
}

data "aws_secretsmanager_secret" "db" {
  name = "db-password"
}

data "aws_secretsmanager_secret_version" "db_password" {
  secret_id = data.aws_secretsmanager_secret.db.id
}