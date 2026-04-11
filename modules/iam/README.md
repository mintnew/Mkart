
# 🎯 **Goal**

We will:

1. Create **GitHub OIDC Provider**
2. Create **IAM Role with trust policy**
3. Attach required policies (ECR push, etc.)
4. Output **Role ARN** → used in GitHub Actions

---

# 📁 **Where to add this**

Inside:

```id="u7p1r9"
terraform/
 └── modules/
     └── iam/
         ├── main.tf
         ├── variables.tf
         └── outputs.tf
```

Then call it from:

```id="k6p9vl"
terraform/environments/dev/main.tf
```

---

# 🧩 **Step 1: variables.tf**

```hcl id="m5j2u1"
variable "github_repo" {
  description = "GitHub repo in format username/repo"
  type        = string
}

variable "github_branch" {
  description = "Branch allowed to assume role"
  type        = string
  default     = "main"
}
```

---

# 🧩 **Step 2: main.tf (IAM Module)**

## ✅ 1. Create OIDC Provider

```hcl id="g1p8x4"
resource "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"

  client_id_list = [
    "sts.amazonaws.com"
  ]

  thumbprint_list = [
    "6938fd4d98bab03faadb97b34396831e3780aea1"
  ]
}
```

---

## ✅ 2. Trust Policy for GitHub

```hcl id="z3v9t7"
data "aws_iam_policy_document" "github_oidc_assume_role" {
  statement {
    effect = "Allow"

    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values = [
        "repo:${var.github_repo}:ref:refs/heads/${var.github_branch}"
      ]
    }
  }
}
```

---

## ✅ 3. Create IAM Role

```hcl id="x8k2q5"
resource "aws_iam_role" "github_actions_role" {
  name               = "github-actions-ecr-role"
  assume_role_policy = data.aws_iam_policy_document.github_oidc_assume_role.json
}
```

---

## ✅ 4. Attach ECR Permissions (Minimal Required)

```hcl id="n4b7w2"
resource "aws_iam_role_policy_attachment" "ecr_access" {
  role       = aws_iam_role.github_actions_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser"
}
```

---

## ✅ 5. (Optional but recommended) Add STS + ECR Login permissions

Custom inline policy:

```hcl id="y6c3h9"
resource "aws_iam_policy" "github_ecr_policy" {
  name = "github-actions-ecr-custom-policy"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:CompleteLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:InitiateLayerUpload",
          "ecr:PutImage"
        ],
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "custom_ecr_attach" {
  role       = aws_iam_role.github_actions_role.name
  policy_arn = aws_iam_policy.github_ecr_policy.arn
}
```

---

# 🧩 **Step 3: outputs.tf**

```hcl id="v1f6p8"
output "github_actions_role_arn" {
  description = "IAM Role ARN for GitHub Actions OIDC"
  value       = aws_iam_role.github_actions_role.arn
}
```

---

# 🧩 **Step 4: Call Module in DEV**

Inside:

```id="z9r2x6"
terraform/environments/dev/main.tf
```

Add:

```hcl id="l3t7m1"
module "github_oidc" {
  source = "../../modules/iam"

  github_repo   = "your-username/your-repo"
  github_branch = "main"
}
```

---

# 🚀 **Step 5: Apply Terraform**

```bash id="a7n3k5"
terraform init
terraform plan
terraform apply
```

---

# 🎯 **Step 6: Get Role ARN**

After apply:

```bash id="u2q4c8"
terraform output github_actions_role_arn
```

Example output:

```id="p5x8d2"
arn:aws:iam::123456789012:role/github-actions-ecr-role
```

---

# 🔗 **Step 7: Use in GitHub Actions**

```yaml id="c9k1w3"
- name: Configure AWS Credentials
  uses: aws-actions/configure-aws-credentials@v2
  with:
    role-to-assume: arn:aws:iam::123456789012:role/github-actions-ecr-role
    aws-region: ap-south-1
```

---

# 🔥 **What You Achieved**

✅ No AWS access keys
✅ Secure OIDC-based auth
✅ Short-lived credentials
✅ Fully automated CI integration

---

# ⚠️ **Common Mistakes (Avoid These)**

❌ Wrong repo name format → must be `username/repo`
❌ Branch mismatch → `main` vs `master`
❌ Forgetting `id-token: write` in GitHub workflow

---

# 🧠 **Pro DevOps Insight**

This is exactly how **modern production pipelines work**:

```text
GitHub → OIDC → IAM Role → Temporary Credentials → ECR
```

No secrets. No leaks. Fully secure.

---

