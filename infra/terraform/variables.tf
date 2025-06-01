variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment (staging, production)"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "omnivara"
}

variable "eks_cluster_version" {
  description = "Kubernetes version for EKS cluster"
  type        = string
  default     = "1.29"
}

variable "eks_node_instance_type" {
  description = "EC2 instance type for EKS worker nodes"
  type        = string
  default     = "t3.medium"
}

variable "eks_node_desired_size" {
  description = "Desired number of EKS worker nodes"
  type        = number
  default     = 3
}

variable "eks_node_min_size" {
  description = "Minimum number of EKS worker nodes"
  type        = number
  default     = 2
}

variable "eks_node_max_size" {
  description = "Maximum number of EKS worker nodes"
  type        = number
  default     = 10
}

variable "rds_instance_class" {
  description = "RDS instance class for PostgreSQL"
  type        = string
  default     = "db.t3.medium"
}

variable "rds_allocated_storage" {
  description = "Allocated storage for RDS in GB"
  type        = number
  default     = 50
}

variable "rds_max_allocated_storage" {
  description = "Maximum allocated storage for RDS autoscaling in GB"
  type        = number
  default     = 200
}

variable "rds_db_name" {
  description = "Database name"
  type        = string
  default     = "omnivara"
}

variable "rds_username" {
  description = "Database master username"
  type        = string
  default     = "omnivara_admin"
  sensitive   = true
}

# rds_password is intentionally removed — the password is now auto-generated
# by random_password.db in database.tf and stored in Secrets Manager.
# Do not pass this variable; doing so has no effect.

variable "elasticache_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.t3.micro"
}

variable "s3_bucket_prefix" {
  description = "Prefix for S3 bucket names"
  type        = string
  default     = "omnivara"
}

variable "domain_name" {
  description = "Primary domain name"
  type        = string
  default     = "omnivara.io"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

# ─── Database variables (used in database.tf) ─────────────────────────────────

variable "db_instance_class" {
  description = "RDS instance class — override per environment. staging: db.t3.medium, production: db.r6g.large"
  type        = string
  default     = "db.t3.medium"
}

variable "db_backup_retention_days" {
  description = "Number of days to retain automated RDS backups (7 recommended for production)"
  type        = number
  default     = 7
}

variable "db_deletion_protection" {
  description = "Enable deletion protection on the RDS instance (automatically true in production)"
  type        = bool
  default     = false
}

# ─── Redis / ElastiCache variables (used in redis.tf) ────────────────────────

variable "redis_node_type" {
  description = "ElastiCache Redis node type — override per environment. staging: cache.t3.micro, production: cache.r6g.large"
  type        = string
  default     = "cache.t3.micro"
}

variable "redis_engine_version" {
  description = "ElastiCache Redis engine version (7.x recommended)"
  type        = string
  default     = "7.1"
}

variable "redis_num_cache_clusters" {
  description = "Number of cache nodes in the replication group (use >= 2 for production HA)"
  type        = number
  default     = 1
}

# ─── Secrets Manager variables ────────────────────────────────────────────────

variable "secrets_recovery_window_days" {
  description = "Days before a deleted Secrets Manager secret is purged. Set to 0 for immediate deletion in non-production."
  type        = number
  default     = 30
}
