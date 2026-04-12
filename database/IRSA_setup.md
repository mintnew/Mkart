

# 🧠 ARCHITECTURE

```text id="arch1"
AWS Secrets Manager
        ↓
IRSA (IAM Role)
        ↓
External Secrets Operator (EKS)
        ↓
Kubernetes Secret (db-secret)
        ↓
Backend Pod (env vars)
        ↓
RDS Connection
```

---

# 🚀 STEP 1: Create Secret in AWS Secrets Manager

### 📌 Command

```bash id="step1"
aws secretsmanager create-secret \
--name prod/rds/backend-db \
--secret-string '{
  "DB_HOST":"your-rds.amazonaws.com",
  "DB_USER":"postgres",
  "DB_PASSWORD":"password123",
  "DB_NAME":"productdb",
  "DB_PORT":"5432"
}'
```

---

### 💡 Explanation

* `create-secret` → creates secret in AWS
* `name` → logical name used in Kubernetes mapping
* `secret-string` → actual DB credentials stored securely

👉 This is your **source of truth**

---

# 🚀 STEP 2: Create IAM Policy for Secrets Access

### 📌 File: `eso-policy.json`

```json id="step2"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": "*"
    }
  ]
}
```

---

### 💡 Explanation

* Grants access to AWS Secrets Manager
* Used by External Secrets Operator (not your app)

---

# 🚀 STEP 3: Create IAM Role using IRSA

### 📌 Command

```bash id="step3"
eksctl create iamserviceaccount \
  --name external-secrets-sa \
  --namespace external-secrets-system \
  --cluster <your-cluster-name> \
  --attach-policy-arn arn:aws:iam::<ACCOUNT_ID>:policy/<policy-name> \
  --approve
```

---

### 💡 Explanation

* Creates IAM Role + Kubernetes ServiceAccount
* This enables **secure AWS access without keys**
* This is called **IRSA (IAM Roles for Service Accounts)**

---

# 🚀 STEP 4: Install External Secrets Operator

### 📌 Command

```bash id="step4"
helm repo add external-secrets https://charts.external-secrets.io

helm install external-secrets external-secrets/external-secrets \
  -n external-secrets-system \
  --create-namespace
```

---

### 💡 Explanation

* Installs ESO controller in cluster
* This controller watches `ExternalSecret` resources

---

# 🚀 STEP 5: Create SecretStore (AWS connection config)

### 📌 File: `secretstore.yaml`

```yaml id="step5"
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: aws-secretstore
  namespace: default
spec:
  provider:
    aws:
      service: SecretsManager
      region: ap-south-1
      auth:
        jwt:
          serviceAccountRef:
            name: external-secrets-sa
```

---

### 💡 Explanation

* Tells ESO how to connect to AWS
* Uses IRSA (no AWS keys)
* `serviceAccountRef` links IAM role

---

# 🚀 STEP 6: Create ExternalSecret (MOST IMPORTANT FILE)

### 📌 File: `externalsecret.yaml`

```yaml id="step6"
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: db-secret
  namespace: default
spec:
  refreshInterval: 1h

  secretStoreRef:
    name: aws-secretstore
    kind: SecretStore

  target:
    name: db-secret
    creationPolicy: Owner

  data:
    - secretKey: DB_HOST
      remoteRef:
        key: prod/rds/backend-db
        property: DB_HOST

    - secretKey: DB_USER
      remoteRef:
        key: prod/rds/backend-db
        property: DB_USER

    - secretKey: DB_PASSWORD
      remoteRef:
        key: prod/rds/backend-db
        property: DB_PASSWORD

    - secretKey: DB_NAME
      remoteRef:
        key: prod/rds/backend-db
        property: DB_NAME

    - secretKey: DB_PORT
      remoteRef:
        key: prod/rds/backend-db
        property: DB_PORT
```

---

### 💡 Explanation

* This maps AWS secret → Kubernetes secret
* ESO automatically syncs every 1 hour
* Creates Kubernetes secret named `db-secret`

---

# 🚀 STEP 7: Apply ESO resources

```bash id="step7"
kubectl apply -f secretstore.yaml
kubectl apply -f externalsecret.yaml
```

---

### 💡 What happens now

✔ ESO connects to AWS
✔ Reads secret
✔ Creates Kubernetes Secret

---

# 🚀 STEP 8: Verify Kubernetes Secret

```bash id="step8"
kubectl get secret db-secret
```

To decode:

```bash id="step8b"
kubectl get secret db-secret -o yaml
```

---

# 🚀 STEP 9: Backend Deployment (uses secret)

### 📌 File: `backend-deployment.yaml`

```yaml id="step9"
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
        - name: backend
          image: your-image
          ports:
            - containerPort: 5000

          env:
            - name: DB_HOST
              valueFrom:
                secretKeyRef:
                  name: db-secret
                  key: DB_HOST

            - name: DB_USER
              valueFrom:
                secretKeyRef:
                  name: db-secret
                  key: DB_USER

            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: db-secret
                  key: DB_PASSWORD

            - name: DB_NAME
              valueFrom:
                secretKeyRef:
                  name: db-secret
                  key: DB_NAME
```

---

### 💡 Explanation

* Backend DOES NOT talk to AWS
* It only reads Kubernetes Secret
* Clean + secure + portable

---

# 🚀 STEP 10: Backend code (simple clean version)

### 📌 No Step 6/7 needed anymore

```js id="step10"
const express = require("express");
const { Pool } = require("pg");

const app = express();

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false }
});

app.get("/", (req, res) => {
  res.send("Backend running with ESO + RDS");
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
```

---

# 🚀 FINAL FLOW

```text id="finalflow"
AWS Secrets Manager
        ↓
External Secrets Operator (IRSA)
        ↓
Kubernetes Secret (db-secret)
        ↓
Backend Deployment
        ↓
RDS Connection
```

---

# 🔥 WHY THIS IS PRODUCTION BEST PRACTICE

✔ No AWS SDK in app
✔ No hardcoded secrets
✔ GitOps friendly (ArgoCD ready)
✔ Central secret management
✔ Easy rotation support
✔ Works across all microservices

---

# 💡 If you want next upgrade, I can build:

🚀 Full ArgoCD GitOps repo structure
🚀 Terraform automation (EKS + ESO + IRSA + RDS)
🚀 CI/CD pipeline (GitHub Actions)
🚀 Multi-env secrets (dev/stage/prod)
🚀 Debug guide for ESO sync issues


