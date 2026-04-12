
---

# **Step 0: Prerequisites**

Make sure you have:

1. **EKS cluster running** and `kubectl` configured.
2. **ArgoCD installed** (either via Helm or manifests).
3. **External Secrets Operator installed** (we did this already).
4. **Backend app Docker image** pushed to ECR.
5. **AWS Secret in Secrets Manager** with JSON keys:

```json
{
  "host": "ecommerce-db.c492m8s2auhj.us-east-1.rds.amazonaws.com",
  "username": "postgres",
  "password": "mypassword101",
  "database": "ecommerce"
}
```

6. **IRSA** configured for ESO service account.

---

# **Step 1: Install ArgoCD (if not installed)**

```bash
# Create namespace
kubectl create namespace argocd

# Install ArgoCD using manifests
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Verify pods
kubectl get pods -n argocd
```

You should see:

```
argocd-server
argocd-repo-server
argocd-application-controller
argocd-dex-server
```

---

# **Step 2: Expose ArgoCD UI**

Option 1: **Port-forward (quick test)**

```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

Then open in browser: `https://localhost:8080`

Login with:

```bash
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
```

---

Option 2: **ALB Ingress** (for production)

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: argocd-ingress
  namespace: argocd
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
spec:
  rules:
    - host: argocd.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: argocd-server
                port:
                  number: 443
```

> Make sure your DNS points to the ALB.

---

# **Step 3: Prepare Git repository structure**

Example:

```
cloud-native-platform/
├─ kubernetes/
│   ├─ manifests/
│   │   ├─ secret_store.yaml
│   │   ├─ external_secret.yaml
│   │   ├─ backend-deployment.yaml
│   │   └─ backend-service.yaml
│   └─ overlays/
│       ├─ dev/
│       └─ prod/
```

* `base/` → common manifests
* `overlays/dev` → environment-specific configs

---

# **Step 4: ExternalSecret & SecretStore in Git**

**secret_store.yaml:**

```yaml
apiVersion: external-secrets.io/v1
kind: SecretStore
metadata:
  name: aws-secret-store
  namespace: ecommerce
spec:
  provider:
    aws:
      service: SecretsManager
      region: us-east-1
      auth:
        jwt:
          serviceAccountRef:
            name: external-secrets-sa
            namespace: external-secrets
```

**external_secret.yaml:**

```yaml
apiVersion: external-secrets.io/v1
kind: ExternalSecret
metadata:
  name: db-secret
  namespace: ecommerce
spec:
  refreshInterval: 1m
  secretStoreRef:
    name: aws-secret-store
    kind: SecretStore
  target:
    name: db-secret
    creationPolicy: Owner
  data:
    - secretKey: DB_HOST
      remoteRef:
        key: prod/db-credentials
        property: host
    - secretKey: DB_USER
      remoteRef:
        key: prod/db-credentials
        property: username
    - secretKey: DB_PASSWORD
      remoteRef:
        key: prod/db-credentials
        property: password
    - secretKey: DB_NAME
      remoteRef:
        key: prod/db-credentials
        property: database
```

---

# **Step 5: Backend Deployment**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: ecommerce
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
          image: 317105901372.dkr.ecr.us-east-1.amazonaws.com/ecommerce-backend:latest
          ports:
            - containerPort: 3000
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

# **Step 6: Create ArgoCD Application**

Option 1: Using CLI:

```bash
argocd app create ecommerce-backend \
  --repo https://github.com/your-org/cloud-native-platform.git \
  --path kubernetes/base \
  --dest-server https://kubernetes.default.svc \
  --dest-namespace ecommerce \
  --sync-policy automated
```

Option 2: Using ArgoCD UI:

* Go to **New App** → fill in repo URL, path, cluster, namespace, select **automated sync** → Create.

---

# **Step 7: Sync and Verify**

```bash
argocd app sync ecommerce-backend
argocd app get ecommerce-backend
```

Check pods:

```bash
kubectl get pods -n ecommerce
```

Check `db-secret` exists:

```bash
kubectl get secret db-secret -n ecommerce
```

---

# **Step 8: What happens in GitOps flow**

1. ESO watches `ExternalSecret` → fetches secret from AWS → creates `db-secret`
2. Backend Deployment references `db-secret` → pods start
3. ArgoCD monitors the repo → automatically syncs Deployment changes
4. Secrets never hardcoded → secure and compliant

---

💡 **Pro Tip:**

* Use **ClusterSecretStore** if you want multiple namespaces to share secrets.
* Set `refreshInterval` to a few minutes to auto-sync secret updates from AWS.
* Use **ArgoCD Notifications** for alerts on failed syncs.

---

