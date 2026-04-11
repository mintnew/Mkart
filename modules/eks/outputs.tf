output "cluster_name" {
  value = aws_eks_cluster.main_cluster.name
}

output "cluster_endpoint" {
  value = aws_eks_cluster.main_cluster.endpoint
}

output "cluster_certificate_authority_data" {
  value = aws_eks_cluster.main_cluster.certificate_authority[0].data
}

output "node_role_arn" {
  value = aws_iam_role.eks_node_role.arn
}