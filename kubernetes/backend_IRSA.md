
👉 ESO + IRSA (IAM Roles for Service Accounts) **will NOT work without OIDC**

---

## ✅ Check if OIDC is already enabled

Run:

```bash
aws eks describe-cluster \
  --name <cluster-name> \
  --query "cluster.identity.oidc.issuer" \
  --output text
```

### Output cases:

### ✔ If you get something like:

```
https://oidc.eks.ap-south-1.amazonaws.com/id/XXXXXXXX
```

→ OIDC exists → move to next step

---

### ❌ If you get:

```
None
```

→ OIDC NOT enabled → you must create it

---

## ✅ Enable OIDC provider

### Option 1 (Recommended): Using `eksctl`

```bash
eksctl utils associate-iam-oidc-provider \
  --cluster <cluster-name> \
  --approve
```

---

### ⚠ Common Errors & Fixes

#### ❌ Error: "AccessDenied"

👉 Your IAM user doesn’t have permission

Fix: Attach policy:

* `IAMFullAccess` (quick test)
  or
* Proper IAM permissions for OIDC

---

#### ❌ Error: "OIDC provider already exists"

👉 Ignore → you're good

---

# 🔴 Step 2: Create IAM Role for ESO (IRSA)

Now we create role that ESO will use to access secrets.

---

## ✅ Create policy (example: Secrets Manager access)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Effect": "Allow",
      "Resource": "*"
    }
  ]
}
```

---

## ✅ Create IAM Role with trust relationship

Replace:

* `<ACCOUNT_ID>`
* `<OIDC_ID>`
* `<NAMESPACE>`
* `<SERVICE_ACCOUNT>`

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::<ACCOUNT_ID>:oidc-provider/oidc.eks.ap-south-1.amazonaws.com/id/<OIDC_ID>"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "oidc.eks.ap-south-1.amazonaws.com/id/<OIDC_ID>:sub": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>"
        }
      }
    }
  ]
}
```

---

# 🔴 Step 3: Install External Secrets Operator (ESO)

ESO is from:
👉 External Secrets Operator

---

## ✅ Add Helm repo

```bash
helm repo add external-secrets https://charts.external-secrets.io
helm repo update
```

---

## ✅ Install ESO

```bash
helm install external-secrets external-secrets/external-secrets \
  -n external-secrets \
  --create-namespace
```

---

## ✅ Verify

```bash
kubectl get pods -n external-secrets
```

---

# 🔴 Step 4: Create Service Account (IMPORTANT)

This must match IAM role trust policy

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: eso-sa
  namespace: external-secrets
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::<ACCOUNT_ID>:role/<ESO_ROLE>
```

Apply:

```bash
kubectl apply -f sa.yaml
```

---

# 🔴 Step 5: Create SecretStore (AWS)

```yaml
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: aws-secret-store
  namespace: external-secrets
spec:
  provider:
    aws:
      service: SecretsManager
      region: ap-south-1
      auth:
        jwt:
          serviceAccountRef:
            name: eso-sa
```

---

# 🔴 Step 6: Create ExternalSecret

Example:

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: my-secret
  namespace: default
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secret-store
    kind: SecretStore
  target:
    name: my-k8s-secret
    creationPolicy: Owner
  data:
    - secretKey: password
      remoteRef:
        key: my-db-secret
        property: password
```

---

# 🔴 Step 7: Verify everything

```bash
kubectl get externalsecrets
kubectl describe externalsecret my-secret
kubectl get secret my-k8s-secret
```

---

# 🚨 Common Issues (Very Important)

### ❌ Secrets not syncing

👉 Check:

```bash
kubectl logs -n external-secrets deploy/external-secrets
```

---

### ❌ AccessDenied (MOST COMMON)

👉 Means IAM role not attached correctly

Check:

* ServiceAccount annotation
* Trust policy
* OIDC ID mismatch

---

### ❌ OIDC mismatch issue

Get correct OIDC ID:

```bash
aws eks describe-cluster --name <cluster-name> \
  --query "cluster.identity.oidc.issuer"
```

Extract:

```
id/XXXXXXXX
```

---

# 💡 Real Tip (from experience)

In real projects (like your PwC type setup):

* Always use **IRSA (OIDC)** → never static AWS keys
* Restrict IAM policy → avoid `"Resource": "*"`
* Use **ClusterSecretStore** if multiple namespaces

---


