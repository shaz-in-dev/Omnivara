# Terraform — AWS Infrastructure

Provisions the full Omnivara production infrastructure on AWS.

## Resources Created

| Resource | Type | Purpose |
|---|---|---|
| VPC | `aws_vpc` | Isolated network with public/private/DB subnets across 3 AZs |
| EKS Cluster | `aws_eks_cluster` | Managed Kubernetes (v1.29) |
| EKS Node Group | `aws_eks_node_group` | t3.medium × 3 (auto-scales to 10) |
| RDS PostgreSQL | `aws_db_instance` | Primary database with pgvector (Multi-AZ in prod) |
| ElastiCache Redis | `aws_elasticache_replication_group` | Session store and cache |
| S3 (uploads) | `aws_s3_bucket` | User file uploads (private, encrypted) |
| S3 (backups) | `aws_s3_bucket` | DB and app backups (90-day expiry) |
| NAT Gateways | `aws_nat_gateway` | 3× for HA egress from private subnets |
| Security Groups | `aws_security_group` | EKS, RDS, Redis isolation |

## Prerequisites

1. **AWS CLI** configured: `aws configure`
2. **Terraform** ≥ 1.6: `terraform -version`
3. **kubectl** for post-deploy access
4. Bootstrap the Terraform state backend (one-time):

```bash
# Create state bucket
aws s3 mb s3://omnivara-terraform-state --region us-east-1
aws s3api put-bucket-versioning \
  --bucket omnivara-terraform-state \
  --versioning-configuration Status=Enabled

# Create DynamoDB lock table
aws dynamodb create-table \
  --table-name omnivara-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

## Deploy

```bash
cd infra/terraform

# Initialize
terraform init

# Plan (review before applying)
terraform plan \
  -var="rds_password=<strong-password>" \
  -var="environment=production"

# Apply
terraform apply \
  -var="rds_password=<strong-password>" \
  -var="environment=production"

# Configure kubectl
$(terraform output -raw kubeconfig_command)

# Deploy Kubernetes manifests
kubectl apply -f ../k8s/
```

## Variables

Key variables (see `variables.tf` for full list):

| Variable | Default | Description |
|---|---|---|
| `aws_region` | `us-east-1` | AWS region |
| `environment` | `production` | staging or production |
| `eks_node_instance_type` | `t3.medium` | Worker node EC2 type |
| `rds_instance_class` | `db.t3.medium` | Database instance class |
| `rds_password` | — | **Required.** Master DB password |
| `domain_name` | `omnivara.io` | Primary domain |

## Estimated Monthly Cost (production)

| Resource | Estimated Cost |
|---|---|
| EKS cluster (control plane) | ~$73 |
| EKS nodes (3× t3.medium) | ~$90 |
| RDS PostgreSQL (db.t3.medium, Multi-AZ) | ~$100 |
| ElastiCache Redis (2× cache.t3.micro) | ~$30 |
| NAT Gateways (3×) | ~$100 |
| S3 + data transfer | ~$20 |
| **Total** | **~$413/month** |

Use `environment=staging` with smaller instances to reduce dev costs to ~$150/month.
