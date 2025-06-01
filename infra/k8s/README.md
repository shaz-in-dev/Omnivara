# Kubernetes Manifests

Deploys Omnivara onto a Kubernetes cluster (EKS recommended).

## Structure

```
infra/k8s/
├── namespace.yaml          # omnivara namespace
├── configmap.yaml          # Non-secret environment config
├── secrets-template.yaml   # Secret keys template (never commit real values)
├── api-deployment.yaml     # NestJS API + Service
├── web-deployment.yaml     # Next.js web + Service
├── ai-deployment.yaml      # FastAPI AI service + Service
├── ingress.yaml            # NGINX ingress with TLS
├── hpa.yaml                # HorizontalPodAutoscalers for all services
└── README.md
```

## Prerequisites

- `kubectl` configured for your cluster
- NGINX Ingress Controller installed
- cert-manager installed with `letsencrypt-prod` ClusterIssuer
- Container images pushed to `ghcr.io/omnivara/*`

## Deploy

```bash
# 1. Create namespace
kubectl apply -f infra/k8s/namespace.yaml

# 2. Apply config (fill secrets first!)
kubectl apply -f infra/k8s/configmap.yaml
cp infra/k8s/secrets-template.yaml /tmp/omnivara-secrets.yaml
# Edit /tmp/omnivara-secrets.yaml with real base64 values
kubectl apply -f /tmp/omnivara-secrets.yaml

# 3. Deploy services
kubectl apply -f infra/k8s/api-deployment.yaml
kubectl apply -f infra/k8s/web-deployment.yaml
kubectl apply -f infra/k8s/ai-deployment.yaml

# 4. Configure ingress and autoscaling
kubectl apply -f infra/k8s/ingress.yaml
kubectl apply -f infra/k8s/hpa.yaml

# 5. Verify
kubectl get pods -n omnivara
kubectl get ingress -n omnivara
```

## Updating a deployment

```bash
# Rolling update (zero-downtime)
kubectl set image deployment/omnivara-api api=ghcr.io/omnivara/api:v1.2.3 -n omnivara
kubectl rollout status deployment/omnivara-api -n omnivara

# Rollback if needed
kubectl rollout undo deployment/omnivara-api -n omnivara
```

## Secrets management

In production, use one of:
- **AWS Secrets Manager + External Secrets Operator** (recommended for EKS)
- **Sealed Secrets** (Bitnami) — encrypt secrets in-repo
- **HashiCorp Vault** — full secrets management
