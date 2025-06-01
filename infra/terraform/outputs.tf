output "eks_cluster_name" {
  description = "EKS cluster name"
  value       = aws_eks_cluster.main.name
}

output "eks_cluster_endpoint" {
  description = "EKS cluster API endpoint"
  value       = aws_eks_cluster.main.endpoint
  sensitive   = true
}

output "eks_cluster_ca" {
  description = "EKS cluster certificate authority data"
  value       = aws_eks_cluster.main.certificate_authority[0].data
  sensitive   = true
}

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = aws_db_instance.postgres.endpoint
  sensitive   = true
}

output "rds_port" {
  description = "RDS PostgreSQL port"
  value       = aws_db_instance.postgres.port
}

output "redis_endpoint" {
  description = "ElastiCache Redis primary endpoint"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
  sensitive   = true
}

output "redis_port" {
  description = "ElastiCache Redis port"
  value       = aws_elasticache_replication_group.redis.port
}

output "s3_uploads_bucket" {
  description = "S3 bucket name for uploads"
  value       = aws_s3_bucket.uploads.bucket
}

output "s3_backups_bucket" {
  description = "S3 bucket name for backups"
  value       = aws_s3_bucket.backups.bucket
}

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "kubeconfig_command" {
  description = "Command to update kubeconfig"
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${aws_eks_cluster.main.name}"
}

# ─── Database outputs (from database.tf resources) ───────────────────────────

output "rds_secret_arn" {
  description = "ARN of the Secrets Manager secret containing RDS credentials (host, port, username, password, DSN URL)"
  value       = aws_secretsmanager_secret.db_credentials.arn
  sensitive   = false # ARN itself is not sensitive; the secret value is protected by IAM
}

output "rds_address" {
  description = "RDS PostgreSQL DNS hostname (without port)"
  value       = aws_db_instance.postgres.address
  sensitive   = true
}

output "db_secret_read_policy_arn" {
  description = "IAM policy ARN to attach to IRSA roles that need to read the DB secret"
  value       = aws_iam_policy.read_db_secret.arn
}

# ─── Redis outputs (from redis.tf resources) ─────────────────────────────────

output "redis_secret_arn" {
  description = "ARN of the Secrets Manager secret containing Redis auth token and connection URL"
  value       = aws_secretsmanager_secret.redis_credentials.arn
  sensitive   = false
}

output "redis_secret_read_policy_arn" {
  description = "IAM policy ARN to attach to IRSA roles that need to read the Redis secret"
  value       = aws_iam_policy.read_redis_secret.arn
}
