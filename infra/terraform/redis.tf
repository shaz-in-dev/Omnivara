# ─────────────────────────────────────────────────────────────────────────────
# redis.tf — ElastiCache Redis 7.x + Secrets Manager auth token
#
# This file manages:
#   • Random auth token for ElastiCache in-transit encryption
#   • AWS Secrets Manager secret storing the Redis auth token
#   • IAM policy allowing EKS pods (via IRSA) to read the Redis secret
#
# The actual aws_elasticache_replication_group, aws_elasticache_subnet_group,
# and aws_security_group.elasticache resources live in main.tf / vpc.tf so
# that Terraform state remains backwards-compatible with the original scaffold.
#
# Node type guidance:
#   staging    → cache.t3.micro   (var.elasticache_node_type default)
#   production → cache.r6g.large  (pass -var="elasticache_node_type=cache.r6g.large")
#
# Automatic failover:
#   Enabled automatically when var.environment == "production" and
#   num_cache_clusters >= 2 (see main.tf).
#
# Encryption:
#   at_rest_encryption_enabled  = true  (AES-256 via AWS-managed key)
#   transit_encryption_enabled  = true  (TLS 1.2+)
#   auth_token                  = supplied via random_password.redis_auth.result
# ─────────────────────────────────────────────────────────────────────────────

# ─── Random Auth Token ────────────────────────────────────────────────────────

# ElastiCache AUTH tokens must be 16-128 characters and contain only printable
# ASCII except for " , @ and /.  We generate a 48-character token that meets
# those constraints.
resource "random_password" "redis_auth" {
  length           = 48
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
  min_upper        = 4
  min_lower        = 4
  min_numeric      = 4
  min_special      = 4

  lifecycle {
    # Rotating the auth token requires a rolling cluster update (~15 min).
    # Taint this resource explicitly when a rotation is needed.
    ignore_changes = [result]
  }
}

# ─── AWS Secrets Manager ─────────────────────────────────────────────────────

resource "aws_secretsmanager_secret" "redis_credentials" {
  name                    = "${var.project_name}/${var.environment}/redis-credentials"
  description             = "ElastiCache Redis auth token for ${var.project_name} ${var.environment}"
  recovery_window_in_days = var.environment == "production" ? 30 : 0

  tags = {
    Name        = "${var.project_name}-${var.environment}-redis-credentials"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_secretsmanager_secret_version" "redis_credentials" {
  secret_id = aws_secretsmanager_secret.redis_credentials.id

  secret_string = jsonencode({
    host       = aws_elasticache_replication_group.redis.primary_endpoint_address
    port       = 6379
    auth_token = random_password.redis_auth.result
    # Full Redis URL with TLS — used by BullMQ / ioredis REDIS_URL env var.
    url        = "rediss://:${random_password.redis_auth.result}@${aws_elasticache_replication_group.redis.primary_endpoint_address}:6379"
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}

# ─── IAM Policy for EKS Pod Access (IRSA) ────────────────────────────────────

resource "aws_iam_policy" "read_redis_secret" {
  name        = "${var.project_name}-${var.environment}-read-redis-secret"
  description = "Allow EKS pods to read the Redis auth token secret"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "GetRedisSecret"
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret",
        ]
        Resource = aws_secretsmanager_secret.redis_credentials.arn
      },
      {
        Sid    = "DecryptRedisSecret"
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey",
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = "secretsmanager.${var.aws_region}.amazonaws.com"
          }
        }
      },
    ]
  })

  tags = {
    Name        = "${var.project_name}-${var.environment}-read-redis-secret-policy"
    Environment = var.environment
  }
}

# ─── EKS Worker Node SG Egress to ElastiCache ────────────────────────────────

# Explicit egress rule on the EKS cluster security group allowing outbound TCP
# to port 6379 on the ElastiCache security group.  Mirrors the ingress rule
# already defined on aws_security_group.elasticache in vpc.tf.
resource "aws_security_group_rule" "eks_to_redis_egress" {
  type                     = "egress"
  from_port                = 6379
  to_port                  = 6379
  protocol                 = "tcp"
  security_group_id        = aws_security_group.eks_cluster.id
  source_security_group_id = aws_security_group.elasticache.id
  description              = "Allow EKS workers to reach ElastiCache Redis on 6379"
}
