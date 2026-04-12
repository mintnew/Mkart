# Cloud-Native 3-Tier Platform on AWS - Complete Documentation
---

## 🏗️ Architecture Diagram

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              GitHub Repository                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ Terraform/   │  │ Kubernetes/  │  │ Docker/      │  │ .github/     │   │
│  │ IaC Code     │  │ Manifests    │  │ Dockerfiles  │  │ workflows/   │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
└─────────┼──────────────────┼──────────────────┼──────────────────┼─────────┘
          │                  │                  │                  │
          │ Git Push         │ Git Push         │ Git Push         │ Trigger
          ▼                  ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         GitHub Actions (CI/CD Pipeline)                      │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ 1. OIDC Authentication → AWS (No static keys!)                     │    │
│  │ 2. Lint & Test Code                                                │    │
│  │ 3. Build Docker Images                                             │    │
│  │ 4. Push to Amazon ECR                                              │    │
│  │ 5. Update Kubernetes Manifests                                     │    │
│  │ 6. Deploy to EKS                                                   │    │
│  └────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
          │
          │ OIDC Trust Relationship
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              AWS Cloud                                       │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                          AWS IAM                                     │    │
│  │  ┌──────────────────┐         ┌──────────────────┐                │    │
│  │  │ OIDC Provider    │◄───────│ GitHub Actions   │                │    │
│  │  │ (GitHub Trust)   │         │ IAM Role         │                │    │
│  │  └──────────────────┘         └──────────────────┘                │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                              VPC                                      │    │
│  │                                                                       │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │    │
│  │  │ Public       │  │ Private      │  │ Private      │              │    │
│  │  │ Subnet AZ1   │  │ Subnet AZ1   │  │ Subnet AZ1   │              │    │
│  │  │              │  │              │  │ (Data)       │              │    │
│  │  │ NAT Gateway  │  │ ┌──────────┐ │  │ ┌──────────┐ │              │    │
│  │  │              │  │ │ EKS Node │ │  │ │  RDS     │ │              │    │
│  │  └──────────────┘  │ │ Group    │ │  │ │PostgreSQL│ │              │    │
│  │                    │ └──────────┘ │  │ └──────────┘ │              │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │    │
│  │  │ Public       │  │ Private      │  │ Private      │              │    │
│  │  │ Subnet AZ2   │  │ Subnet AZ2   │  │ Subnet AZ2   │              │    │
│  │  │              │  │              │  │ (Data)       │              │    │
│  │  │ NAT Gateway  │  │ ┌──────────┐ │  │              │              │    │
│  │  │              │  │ │ EKS Node │ │  │              │              │    │
│  │  └──────────────┘  │ │ Group    │ │  │              │              │    │
│  │                    │ └──────────┘ │  │              │              │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │    │
│  │  │ Public       │  │ Private      │  │ Private      │              │    │
│  │  │ Subnet AZ3   │  │ Subnet AZ3   │  │ Subnet AZ3   │              │    │
│  │  │              │  │              │  │ (Data)       │              │    │
│  │  │ NAT Gateway  │  │ ┌──────────┐ │  │              │              │    │
│  │  │              │  │ │ EKS Node │ │  │              │              │    │
│  │  └──────────────┘  │ │ Group    │ │  │              │              │    │
│  │                    │ └──────────┘ │  │              │              │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                          EKS Cluster                                  │    │
│  │  ┌────────────────────────────────────────────────────────────┐     │    │
│  │  │                    Kubernetes Pods                          │     │    │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                │     │    │
│  │  │  │Frontend  │  │Backend   │  │Frontend  │                │     │    │
│  │  │  │Pod       │  │Pod       │  │Pod       │                │     │    │
│  │  │  │(React)   │  │(Node.js) │  │(React)   │                │     │    │
│  │  │  └────┬─────┘  └────┬─────┘  └────┬─────┘                │     │    │
│  │  │       │             │             │                        │     │    │
│  │  │  ┌────┴─────────────┴─────┐ ┌────┴─────────────┐          │     │    │
│  │  │  │Load Balancer (ALB)     │ │Horizontal Pod   │          │     │    │
│  │  │  │(Internet-facing)       │ │Autoscaler (HPA) │          │     │    │
│  │  │  └────────────────────────┘ └─────────────────┘          │     │    │
│  │  └────────────────────────────────────────────────────────────┘     │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                        Amazon ECR                                    │    │
│  │  ┌──────────────────┐         ┌──────────────────┐                │    │
│  │  │ Backend Images   │         │ Frontend Images  │                │    │
│  │  │ (:latest, :v1)   │         │ (:latest, :v1)   │                │    │
│  │  └──────────────────┘         └──────────────────┘                │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                     AWS Secrets Manager                              │    │
│  │  ┌────────────────────────────────────────────────────────────┐    │    │
│  │  │ Database passwords, API keys (encrypted at rest)          │    │    │
│  │  └────────────────────────────────────────────────────────────┘    │    │
│  └────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow Diagram

```
User Request Flow:
═══════════════════════════════════════════════════════════════════════════════

   User                    AWS ALB                    EKS Cluster
    │                         │                            │
    │  1. HTTPS Request       │                            │
    ├────────────────────────►│                            │
    │  (GET /todos)           │                            │
    │                         │  2. Route to Frontend      │
    │                         ├───────────────────────────►│
    │                         │                            │
    │                         │                    ┌───────┴────────┐
    │                         │                    │ Frontend Pod   │
    │                         │                    │ (React)        │
    │                         │                    └───────┬────────┘
    │                         │                            │
    │                         │  3. API Call to Backend    │
    │                         │    (http://backend:3000)   │
    │                         │                    ┌───────┴────────┐
    │                         │                    │ Backend Pod    │
    │                         │                    │ (Node.js)      │
    │                         │                    └───────┬────────┘
    │                         │                            │
    │                         │  4. Database Query         │
    │                         │    (PostgreSQL)            │
    │                         │                    ┌───────┴────────┐
    │                         │                    │ RDS Instance   │
    │                         │                    │ (PostgreSQL)   │
    │                         │                    └───────┬────────┘
    │                         │                            │
    │  5. JSON Response       │  6. Return Data            │
    │◄────────────────────────┤◄───────────────────────────┤
    │  (List of todos)        │                            │

CI/CD Pipeline Flow:
═══════════════════════════════════════════════════════════════════════════════

Developer           GitHub              GitHub Actions            AWS
    │                  │                      │                    │
    │  1. git push     │                      │                    │
    ├─────────────────►│                      │                    │
    │                  │  2. Trigger Workflow │                    │
    │                  ├─────────────────────►│                    │
    │                  │                      │                    │
    │                  │                      │  3. OIDC Auth      │
    │                  │                      │  (No access keys!) │
    │                  │                      ├───────────────────►│
    │                  │                      │                    │
    │                  │                      │  4. Get Temp Creds │
    │                  │                      │◄───────────────────┤
    │                  │                      │                    │
    │                  │                      │  5. Build & Push   │
    │                  │                      │  to ECR            │
    │                  │                      ├───────────────────►│
    │                  │                      │                    │
    │                  │                      │  6. Update K8s     │
    │                  │                      │  Manifests         │
    │                  │                      ├───────────────────►│
    │                  │                      │                    │
    │  7. Deployed!    │  6. Success          │  5. Deploy to EKS  │
    │◄─────────────────┤◄─────────────────────┤◄───────────────────┤
```

---

## 💡 Design Rationale

### Why We Chose Each AWS Service

| Service | Why We Used It | Alternatives Considered | Why Not Alternatives |
|---------|---------------|------------------------|---------------------|
| **EKS (Kubernetes)** | Managed Kubernetes with AWS integration | ECS, Self-managed K8s | ECS less portable; Self-managed too complex |
| **ECR** | Native Docker registry with IAM integration | Docker Hub, Artifactory | Better security with IAM; No egress costs |
| **RDS** | Managed PostgreSQL with automated backups | DynamoDB, Self-managed | RDS handles backups, failover, patching |
| **VPC with Private Subnets** | Security through network isolation | Public subnets only | Private subnets = defense in depth |
| **NAT Gateway** | Allow private instances to access internet | Bastion host, No outbound | Managed service vs self-managed bastion |
| **Secrets Manager** | Centralized secrets with rotation | Parameter Store, env vars | Automatic rotation + audit logging |

### Why We Chose Terraform Structure

```
terraform/
├── modules/          ← Reusable components (DRY principle)
│   ├── vpc/         ← Can be used for dev/staging/prod
│   ├── eks/         ← Same EKS module for all environments
│   └── rds/         ← Database module with environment-specific configs
├── environments/    ← Environment-specific values
│   ├── dev/         ← Smaller instances, fewer nodes
│   └── prod/        ← Larger instances, HA configuration
└── backend.tf       ← Remote state (team collaboration)
```

**Why This Structure:**
- **DRY (Don't Repeat Yourself)**: One module used across environments
- **Collaboration**: Remote state in S3 with DynamoDB locking prevents conflicts
- **Auditability**: State files versioned, changes tracked
- **Reusability**: Modules can be shared across projects

### Why We Chose OIDC Over Static Keys

| Aspect | Static Keys (❌) | OIDC (✅) |
|--------|-----------------|-----------|
| **Security** | Keys stored in GitHub Secrets | No long-lived credentials |
| **Rotation** | Manual rotation needed | Automatic, short-lived tokens |
| **Leak Risk** | High - keys can be exposed | Low - tokens expire quickly |
| **Audit** | Hard to track who used keys | Each assume role is logged |
| **Compliance** | Often violates security policies | Meets security best practices |

### Why We Chose GitHub Actions

| Feature | Benefit |
|---------|---------|
| **Native OIDC support** | Seamless AWS integration without secrets |
| **Matrix builds** | Test across multiple Node versions |
| **Self-hosted runners** | Can run in VPC for private resources |
| **Reusable workflows** | Share CI/CD logic across repos |
| **Built-in caching** | Faster builds with dependency caching |

### Why Kubernetes (EKS) Over Other Options

```
Comparison:
═══════════════════════════════════════════════════════════════════════

Feature              EKS (K8s)          ECS               Lambda
───────────────────────────────────────────────────────────────────────
Portability          ✅ High            ❌ Low            ❌ Very Low
                    (Run anywhere)    (AWS-only)        (AWS-only)

Cold Start           ✅ None            ✅ None           ❌ Yes (500ms+)

Stateful Apps        ✅ Good            ✅ Good           ❌ Poor

Custom Networking    ✅ Full control    ❌ Limited        ❌ VPC only

Cost                 💰 Medium          💰 Medium         💰 Low (spiky)

Dev Experience       🌟 Complex         🌟 Easy           🌟 Easy

Scaling Speed        ⚡ 10-30 sec       ⚡ 10-30 sec      ⚡ <100ms

Our Choice: EKS because we need portability and complex networking
```

### Security Architecture Decisions

```
Defense in Depth Layers:
═══════════════════════════════════════════════════════════════════════

Layer 1: Network Security
├── VPC with private subnets for workloads
├── No direct internet access to databases
├── Security groups with least privilege
└── NAT Gateways for controlled outbound access

Layer 2: IAM Security  
├── OIDC for CI/CD (no static keys)
├── IRSA for pod-level permissions
├── IAM roles with least privilege
└── Regular credential rotation

Layer 3: Application Security
├── Container images scanned in ECR
├── Secrets from AWS Secrets Manager (not env vars)
├── HPA prevents DDoS via auto-scaling
└── ALB with WAF ready (can add)

Layer 4: Data Security
├── RDS encryption at rest (KMS)
├── TLS for data in transit
├── Automated backups
└── Private subnets for database
```

### Cost Optimization Decisions

| Decision | Why | Cost Impact |
|----------|-----|--------------|
| **Single NAT Gateway in dev** | Dev doesn't need HA | Saves ~$32/month |
| **t3.medium nodes** | Balance of cost/performance | ~$35/month per node |
| **RDS t3.micro in dev** | Minimal spec for testing | ~$15/month |
| **ECR lifecycle policy** | Auto-delete old images | Saves storage costs |
| **HPA with 2-10 replicas** | Scales down when idle | 50-70% savings off-peak |
| **Dev environment shutdown** | Can destroy when not used | ~$150/month saved |

---

## 🔐 OIDC Setup Guide

### What is OIDC and Why Do We Need It?

**OpenID Connect (OIDC)** is an authentication layer that allows GitHub Actions to request temporary credentials from AWS without storing any long-lived access keys.

**The Problem OIDC Solves:**
```
Traditional Approach (INSECURE):
═══════════════════════════════════════════════════════════════════
GitHub Secrets → AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY
                    ↓
              If leaked, attacker has permanent access!
                    ↓
              Must manually rotate keys regularly

Our Approach (SECURE):
═══════════════════════════════════════════════════════════════════
GitHub Actions → Requests JWT token from GitHub's OIDC provider
                    ↓
              Sends JWT to AWS STS
                    ↓
              AWS validates JWT with OIDC provider
                    ↓
              Returns temporary credentials (15 min - 1 hour)
                    ↓
              Credentials auto-expire, no rotation needed!
```

### Step-by-Step OIDC Implementation

#### Step 1: Create OIDC Provider in AWS IAM

**What we're doing:** Creating a trust relationship between GitHub and AWS.

**Terraform Code:**
```hcl
resource "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"
  
  client_id_list = ["sts.amazonaws.com"]
  
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}
```

**What this does:**
- Registers GitHub as a trusted identity provider
- AWS will accept JWTs signed by GitHub
- The thumbprint verifies GitHub's SSL certificate

#### Step 2: Create IAM Role with Trust Policy

**What we're doing:** Creating a role that GitHub Actions can assume.

**Terraform Code:**
```hcl
data "aws_iam_policy_document" "github_trust" {
  statement {
    effect = "Allow"
    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }
    actions = ["sts:AssumeRoleWithWebIdentity"]
    
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:YOUR_USERNAME/cloud-native-3tier:*"]
    }
  }
}
```

**What this does:**
- Allows GitHub Actions from YOUR specific repository
- The `sub` condition ensures only your repo can assume the role
- Wildcard `:*` allows any branch (can restrict to `:ref:refs/heads/main`)

#### Step 3: Attach Permissions to the Role

**What we're doing:** Granting specific AWS permissions.

**Terraform Code:**
```hcl
resource "aws_iam_role_policy_attachment" "github_actions" {
  role       = aws_iam_role.github_actions.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"  // SCOPE DOWN!
}
```

**⚠️ IMPORTANT:** In production, scope down permissions! Example:
```hcl
# Instead of AdministratorAccess, use custom policy:
resource "aws_iam_role_policy" "github_actions_custom" {
  name = "github-actions-custom"
  role = aws_iam_role.github_actions.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:PutImage"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "eks:DescribeCluster",
          "eks:UpdateClusterConfig"
        ]
        Resource = "arn:aws:eks:*:*:cluster/*"
      }
    ]
  })
}
```

#### Step 4: Configure GitHub Actions Workflow

**What we're doing:** Using the OIDC role in our pipeline.

**GitHub Actions YAML:**
```yaml
name: Deploy to AWS

# Required permissions for OIDC
permissions:
  id-token: write   # Request JWT token
  contents: read    # Read repository contents

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      # Configure AWS using OIDC (NO SECRETS!)
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::1234567890:role/github-actions-role
          aws-region: us-east-1
      
      # Now you can run AWS commands
      - name: Login to ECR
        run: aws ecr get-login-password | docker login --username AWS --password-stdin ${{ env.ECR_REGISTRY }}
```

#### Step 5: Verify OIDC is Working

**Test the setup manually:**
```bash
# In GitHub Actions, add debug step:
- name: Debug OIDC
  run: |
    echo "AWS Account: $(aws sts get-caller-identity)"
    echo "Role ARN: ${{ secrets.AWS_ROLE_ARN }}"
```

**Expected output:**
```json
{
  "UserId": "AROAXYZ123:GitHubActions",
  "Account": "123456789012",
  "Arn": "arn:aws:sts::123456789012:assumed-role/github-actions-role/GitHubActions"
}
```

### OIDC Security Best Practices

```yaml
# 1. Restrict to specific branches
condition {
  test     = "StringLike"
  variable = "token.actions.githubusercontent.com:sub"
  values   = ["repo:org/repo:ref:refs/heads/main"]  # Only main branch
}

# 2. Restrict to specific environments
condition {
  test     = "StringLike"
  variable = "token.actions.githubusercontent.com:sub"
  values   = ["repo:org/repo:environment:prod"]  # Only prod environment
}

# 3. Use short-lived sessions
# In GitHub Actions, the default is 1 hour - perfectly fine
```

### Troubleshooting OIDC

| Problem | Likely Cause | Solution |
|---------|--------------|----------|
| `Unable to assume role` | Wrong role ARN | Check role ARN in workflow |
| `Access denied` | Missing permissions | Attach required policies |
| `Invalid token` | Wrong thumbprint | Update OIDC provider thumbprint |
| `Condition not satisfied` | Branch restriction | Check repo:org/repo:ref format |

---

## 🚀 Bootstrap Instructions

### Prerequisites Checklist

Before starting, ensure you have:

```bash
✅ AWS Account with administrative access
✅ GitHub Account
✅ Domain name (optional, for production)
✅ Credit card on file for AWS (free tier eligible)
```

### Local Tools Installation

```bash
# 1. Install AWS CLI
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"  # macOS
sudo installer -pkg AWSCLIV2.pkg -target /                         # macOS
# OR for Linux:
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# 2. Install Terraform (v1.0+)
# macOS:
brew install terraform
# Linux:
wget -O- https://apt.releases.hashicorp.com/gpg | gpg --dearmor | sudo tee /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install terraform

# 3. Install kubectl
# macOS:
brew install kubectl
# Linux:
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/

# 4. Install Docker
# macOS: Download from https://docker.com
# Linux:
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 5. Install GitHub CLI (optional)
brew install gh  # macOS
# OR
sudo apt install gh  # Linux

# Verify installations
aws --version
terraform --version
kubectl version --client
docker --version
```

### Step-by-Step Bootstrap Process

#### Phase 1: Initial Setup (5 minutes)

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/cloud-native-3tier.git
cd cloud-native-3tier

# 2. Configure AWS credentials (ONE TIME)
aws configure
# Enter:
#   AWS Access Key ID: YOUR_KEY
#   AWS Secret Access Key: YOUR_SECRET
#   Default region: us-east-1
#   Output format: json

# 3. Create S3 bucket for Terraform state (MANUAL - one time)
export BUCKET_NAME="cloud-native-3tier-tfstate-$(aws sts get-caller-identity --query Account --output text)"
aws s3 mb s3://$BUCKET_NAME --region us-east-1

# 4. Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name terraform-locks-dev \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST

# 5. Update backend configuration
sed -i "s/your-unique-state-bucket-name/$BUCKET_NAME/g" terraform/backend.tf
```

#### Phase 2: Deploy Infrastructure (10 minutes)

```bash
# 1. Navigate to Terraform directory
cd terraform

# 2. Initialize Terraform
terraform init

# 3. Review what will be created
terraform plan -var-file="environments/dev/terraform.tfvars"

# Expected output: ~50 resources to add

# 4. Apply the infrastructure
terraform apply -var-file="environments/dev/terraform.tfvars" -auto-approve

# This creates:
#   ✓ VPC with 3 AZs
#   ✓ Private & Public subnets
#   ✓ NAT Gateways
#   ✓ EKS Cluster
#   ✓ RDS Database
#   ✓ ECR Repositories
#   ✓ IAM Roles for OIDC

# 5. Wait for EKS cluster (5-7 minutes)
# You'll see: "module.eks.aws_eks_cluster.this: Still creating..."
```

#### Phase 3: Configure Kubernetes Access (2 minutes)

```bash
# 1. Get EKS cluster credentials
aws eks update-kubeconfig --region us-east-1 --name cloud-native-3tier-dev

# 2. Verify access
kubectl get nodes
# Should show: 2 nodes in Ready state

# 3. Create namespaces
kubectl create namespace ecommerce
kubectl create namespace argocd

# 4. Install ArgoCD (GitOps tool)
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# 5. Wait for ArgoCD pods
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=argocd-server -n argocd --timeout=300s

# 6. Get ArgoCD admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
# Save this password!
```

#### Phase 4: Build and Deploy Application (5 minutes)

```bash
# 1. Build Docker images locally
cd ../services/backend
docker build -t ecommerce-backend:latest .

cd ../frontend
docker build -t ecommerce-frontend:latest .

# 2. Get ECR repository URIs
cd ../../terraform
export BACKEND_ECR=$(terraform output -raw backend_repository_url)
export FRONTEND_ECR=$(terraform output -raw frontend_repository_url)

# 3. Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $(echo $BACKEND_ECR | cut -d/ -f1)

# 4. Tag and push images
docker tag ecommerce-backend:latest $BACKEND_ECR:latest
docker push $BACKEND_ECR:latest

docker tag ecommerce-frontend:latest $FRONTEND_ECR:latest
docker push $FRONTEND_ECR:latest

# 5. Deploy to Kubernetes
cd ../kubernetes
kubectl apply -k manifests/dev

# 6. Wait for deployment
kubectl rollout status deployment/backend -n ecommerce --timeout=300s
kubectl rollout status deployment/frontend -n ecommerce --timeout=300s

# 7. Get the application URL
kubectl get service frontend-service -n ecommerce
# Look for EXTERNAL-IP (may take 2-3 minutes to provision)
```

#### Phase 5: Configure GitHub Actions (10 minutes)

```bash
# 1. Get the OIDC role ARN
cd ../terraform
export OIDC_ROLE_ARN=$(terraform output -raw github_actions_role_arn)
echo "Role ARN: $OIDC_ROLE_ARN"

# 2. Add secret to GitHub repository
gh secret set AWS_ROLE_ARN --body "$OIDC_ROLE_ARN"
# OR manually:
# Go to GitHub → Settings → Secrets and variables → Actions → New repository secret
# Name: AWS_ROLE_ARN
# Value: $OIDC_ROLE_ARN

# 3. Push code to trigger pipeline
git add .
git commit -m "Initial deployment"
git push origin main

# 4. Monitor pipeline
# Go to GitHub → Actions tab
# Watch the workflow run
```

#### Phase 6: Verify Everything Works

```bash
# 1. Test the API directly
export API_URL=$(kubectl get service backend-service -n ecommerce -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
curl http://$API_URL/ecommerce

# Expected: [] (empty array)

# 2. Create a todo via API
curl -X POST http://$API_URL/ecommerce \
  -H "Content-Type: application/json" \
  -d '{"task":"Learn AWS EKS"}'

# 3. Get todos again
curl http://$API_URL/ecommerce
# Expected: [{"id":1,"task":"Learn AWS EKS","completed":false}]

# 4. Access the frontend
export FRONTEND_URL=$(kubectl get service frontend-service -n ecommerce -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
echo "Open in browser: http://$FRONTEND_URL"
```

### Common Bootstrap Issues & Solutions

| Issue | Solution |
|-------|----------|
| `Error: AccessDenied` when creating S3 bucket | Ensure AWS credentials have admin access |
| EKS cluster creation timeout | Increase timeout: `kubectl wait --timeout=15m` |
| `No nodes found` | Check node group: `kubectl get nodes -w` |
| RDS connection refused | Check security group rules |
| OIDC role not assuming | Verify trust policy conditions |
| Docker push fails | Run `aws ecr get-login-password` again |

### Cost Estimation (Dev Environment)

```
Monthly Cost Breakdown:
═══════════════════════════════════════════════════════════════════

Service              Specification              Monthly Cost
───────────────────────────────────────────────────────────────────
EKS Cluster         Managed control plane       $72.00
EC2 Nodes (2)       t3.medium × 2               $70.00
RDS                 db.t3.micro                 $15.00
NAT Gateway         1 × single                  $32.25
VPC                 Free                        $0.00
ECR Storage         10GB                        $1.00
Load Balancer       Application LB              $20.00
Data Transfer       ~100GB                      $9.00
───────────────────────────────────────────────────────────────────
TOTAL                                           ~$219.25/month

💡 Cost Savings Tips:
- Destroy dev environment when not in use: terraform destroy
- Use t3.small for development
- Reduce to 1 node for testing
- Use Spot instances for non-production
```

### Cleanup Instructions

```bash
# 1. Delete Kubernetes resources
kubectl delete -k kubernetes/manifests/dev

# 2. Destroy Terraform infrastructure
cd terraform
terraform destroy -var-file="environments/dev/terraform.tfvars" -auto-approve

# 3. Delete S3 bucket (contains state files)
aws s3 rm s3://$BUCKET_NAME --recursive
aws s3 rb s3://$BUCKET_NAME

# 4. Delete DynamoDB table
aws dynamodb delete-table --table-name terraform-locks-dev
```

---

## 📁 Project Structure

```
cloud-native-3tier/
│
├── .github/workflows/                 # CI/CD Pipeline
│   ├── deploy.yml                     # Main deployment workflow
│   └── security-scan.yml              # Vulnerability scanning
│
├── terraform/                         # Infrastructure as Code
│   ├── main.tf                        # Root module configuration
│   ├── variables.tf                   # Input variables
│   ├── outputs.tf                     # Output values
│   ├── provider.tf                    # AWS provider config
│   ├── backend.tf                     # Remote state config
│   │
│   ├── modules/                       # Reusable components
│   │   ├── vpc/                       # VPC with public/private subnets
│   │   │   ├── main.tf
│   │   │   ├── variables.tf
│   │   │   └── outputs.tf
│   │   ├── eks/                       # EKS cluster and node groups
│   │   │   ├── main.tf
│   │   │   ├── variables.tf
│   │   │   └── outputs.tf
│   │   ├── rds/                       # PostgreSQL database
│   │   │   ├── main.tf
│   │   │   ├── variables.tf
│   │   │   └── outputs.tf
│   │   ├── ecr/                       # Container registry
│   │   │   ├── main.tf
│   │   │   ├── variables.tf
│   │   │   └── outputs.tf
│   │   └── iam/                       # IAM roles & OIDC
│   │       ├── main.tf
│   │       ├── variables.tf
│   │       └── outputs.tf
│   │
│   └── environments/                  # Environment configs
│       ├── dev/
│       │   └── terraform.tfvars       # Dev-specific values
│       └── prod/
│           └── terraform.tfvars       # Prod-specific values
│
├── kubernetes/                        # K8s Manifests
│   ├── base/                          # Shared configuration
│   │   ├── kustomization.yaml
│   │   ├── namespace.yaml
│   │   ├── backend.yaml               # Backend deployment + service
│   │   ├── frontend.yaml              # Frontend deployment + service
│   │   ├── hpa.yaml                   # Horizontal Pod Autoscaler
│   │   ├── ingress.yaml               # ALB Ingress
│   │   └── secret-provider-class.yaml # Secrets Manager integration
│   │
│   ├── overlays/                      # Environment overrides
│   │   ├── dev/
│   │   │   ├── kustomization.yaml
│   │   │   └── replica-count.yaml
│   │   └── prod/
│   │       ├── kustomization.yaml
│   │       ├── replica-count.yaml
│   │       └── resource-limits.yaml
│   │
│   └── argocd/                        # GitOps configuration
│       └── application.yaml
│
├── services/                          # Application Code
│   ├── backend/                       # Node.js API
│   │   ├── Dockerfile                 # Multi-stage build
│   │   ├── package.json
│   │   ├── index.js
│   │   └── .dockerignore
│   │
│   ├── frontend/                      # React App
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── src/
│   │
│   └── database/                      # DB initialization
│       └── init.sql
│
├── scripts/                           # Utility scripts
│   ├── terraform.sh                   # Terraform wrapper
│   └── setup.sh                       # Bootstrap helper
│
├── Makefile                           # Common commands
├── docker-compose.yml                 # Local development
├── .gitignore
└── README.md                          # This file!
```

### Key Files Explained

| File | Purpose | Why It's Important |
|------|---------|---------------------|
| `terraform/backend.tf` | S3 remote state | Team collaboration, state locking |
| `terraform/modules/iam/github-oidc.tf` | OIDC configuration | No static AWS keys in CI/CD |
| `kubernetes/base/hpa.yaml` | Auto-scaling | Application scales with load |
| `.github/workflows/deploy.yml` | CI/CD pipeline | Automated deployments |
| `services/backend/Dockerfile` | Container build | Reproducible application packaging |

---

## 🎯 Quick Reference Commands

```bash
# Infrastructure
make init          # Initialize Terraform
make plan          # See what will change
make apply         # Deploy infrastructure
make destroy       # Remove everything

# Application
make dev-start     # Start local dev with docker-compose
make dev-stop      # Stop local dev
make build         # Build Docker images
make deploy        # Deploy to Kubernetes

# Kubernetes
kubectl get pods -n todo-app-dev
kubectl logs -f deployment/backend -n todo-app-dev
kubectl port-forward service/backend-service 3000:80

# Monitoring
kubectl top nodes
kubectl top pods -n todo-app-dev
kubectl get hpa -n todo-app-dev
```

