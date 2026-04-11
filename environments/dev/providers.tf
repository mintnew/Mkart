
# EKS Authentication
data "aws_eks_cluster_auth" "cluster" {
  name = module.eks.cluster_name
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "cloud-native-platform"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}