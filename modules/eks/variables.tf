variable "cluster_name" {
  type        = string
  description = "EKS cluster name"
}

variable "vpc_id" {
  type        = string
  description = "VPC ID for EKS cluster"
}

variable "private_subnets" {
  type        = list(string)
  description = "Private subnet IDs for worker nodes"
}

variable "public_subnets" {
  type        = list(string)
  description = "Public subnet IDs for load balancers and NAT"
}

variable "region" {
  type        = string
  description = "AWS Region"
  default     = "us-east-1"
}