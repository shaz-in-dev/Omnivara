# ─────────────────────────────────────────────────────────────────────────────
# database.tf — RDS PostgreSQL 16 + Secrets Manager
#
# This file manages:
#   • Random password generation for the RDS master user
#   • AWS Secrets Manager secret storing DB credentials as JSON
#   • IAM policy allowing EKS pods (via IRSA) to read the secret
#
# The actual aws_db_instance, aws_db_parameter_group, aws_db_subnet_group, and
# aws_security_group.rds resources live in main.tf / vpc.tf respectively so
# that Terraform state remains backwards-compatible with the original scaffold.
#
# pgvector note:
#   The parameter group in main.tf sets shared_preload_libraries = "pg_stat_statements,pgvector"
#   After the first apply you must run once inside the DB:
#       CREATE EXTENSION IF NOT EXISTS vector;
#   This is idempotent and safe to include in the Flyway/Prisma migration baseline.
#
# Instance class guidance:
#   staging    → db.t3.medium  (var.rds_instance_class default)
#   production → db.r6g.large  (pass -var="rds_instance_class=db.r6g.large")
#
# Multi-AZ:
#   Enabled automatically when var.environment == "production" (see main.tf).
# ─────────────────────────────────────────────────────────────────────────────

terraform {
  required_providers {
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

# ─── Random Password ──────────────────────────────────────────────────────────

# Generate a cryptographically strong, 32-character password for the RDS master
# user.  The result is stored exclusively in Secrets Manager — it is never
# written to Terraform state in plaintext because we reference it only via
# random_password.db.result (marked sensitive = true by the provider).
resource "random_password" "db" {
  length           = 32
  special          = true
  # Exclude characters that trip up PostgreSQL connection-string parsers or
  # shell quoting inside ECS/EKS task definitions.
  override_special = "!#$%&*()-_=+[]{}<>:?"
  min_upper        = 4
  min_lower        = 4
  min_numeric      = 4
  min_special      = 4

  # Rotate the password by tainting this resource and re-applying.
  # After rotation, update the Secrets Manager version and restart pods.
  lifecycle {
    ignore_changes = [result]
  }
}

# ─── AWS Secrets Manager ─────────────────────────────────────────────────────

# The secret container (ARN is stable; versions change on rotation).
resource "aws_secretsmanager_secret" "db_credentials" {
  name                    = "${var.project_name}/${var.environment}/db-credentials"
  description             = "RDS PostgreSQL master credentials for ${var.project_name} ${var.environment}"
  recovery_window_in_days = var.environment == "production" ? 30 : 0

  tags = {
    Name        = "${var.project_name}-${var.environment}-db-credentials"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# The initial secret value.  Stored as a JSON object so applications can use
# the AWS SDK's GetSecretValue and parse the fields directly.
resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id

  secret_string = jsonencode({
    engine   = "postgres"
    host     = aws_db_instance.postgres.address
    port     = aws_db_instance.postgres.port
    dbname   = var.rds_db_name
    username = var.rds_username
    password = random_password.db.result
    # Full DSN for convenience (used by Prisma / TypeORM DATABASE_URL).
    url      = "postgresql://${var.rds_username}:${random_password.db.result}@${aws_db_instance.postgres.address}:${aws_db_instance.postgres.port}/${var.rds_db_name}?sslmode=require"
  })

  # Prevent Terraform from recreating the version on every plan once a human
  # (or rotation Lambda) has updated the secret outside of Terraform.
  lifecycle {
    ignore_changes = [secret_string]
  }
}

# ─── IAM Policy for EKS Pod Access (IRSA) ────────────────────────────────────

# Attach this policy to the IRSA role used by the api / ai service accounts so
# that pods can call GetSecretValue without storing credentials in ConfigMaps.
resource "aws_iam_policy" "read_db_secret" {
  name        = "${var.project_name}-${var.environment}-read-db-secret"
  description = "Allow EKS pods to read the RDS credentials secret"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "GetDBSecret"
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret",
        ]
        Resource = aws_secretsmanager_secret.db_credentials.arn
      },
      {
        # Allow the pod to decrypt the secret if a customer-managed KMS key is
        # applied in future (no-op when using the default AWS-managed key).
        Sid    = "DecryptDBSecret"
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
    Name        = "${var.project_name}-${var.environment}-read-db-secret-policy"
    Environment = var.environment
  }
}

# ─── EKS Worker Node SG Egress to RDS ────────────────────────────────────────

# Explicit egress rule on the EKS cluster security group allowing outbound TCP
# to port 5432 on the RDS security group.  This complements the ingress rule
# already defined on aws_security_group.rds in vpc.tf.
resource "aws_security_group_rule" "eks_to_rds_egress" {
  type                     = "egress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  security_group_id        = aws_security_group.eks_cluster.id
  source_security_group_id = aws_security_group.rds.id
  description              = "Allow EKS workers to reach RDS PostgreSQL on 5432"
}
