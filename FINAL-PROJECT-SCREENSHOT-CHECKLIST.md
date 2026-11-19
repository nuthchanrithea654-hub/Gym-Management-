# CLD 376 Final Project — Screenshot Checklist

Capture real results only. Hide tokens, passwords, password hashes, Atlas URIs, real Secret contents and personal information. Commands and setup are in [the final guide](./KUBERNETES-FINAL-README.md).

- [ ] 01 — Existing Source Repository and Preserved Midterm EC2 Deployment
- [ ] 02 — Kubernetes Architecture and Centralized API Gateway Request Flow
- [ ] 03 — YAML Namespace, ConfigMap and Placeholder Secret Template
- [ ] 04 — YAML Seven Deployments, Probes and Resource Limits
- [ ] 05 — YAML Seven ClusterIP Services and Matching Selectors
- [ ] 06 — YAML NGINX Ingress: gym.aupp.com and All Paths to API Gateway
- [ ] 07 — YAML Membership Two Replicas and Pod Name Downward API
- [ ] 08 — YAML Shared emptyDir Volume and Non-root Logging Sidecar
- [ ] 09 — Mac ARM64 Architecture and Docker Desktop Running
- [ ] 10 — Existing Docker Hub Image Platform Audit
- [ ] 11 — Seven Locally Built Images Available Inside Minikube
- [ ] 12 — Minikube Status and Ready Kubernetes Node
- [ ] 13 — Seven Ready Deployments: Membership 2/2
- [ ] 14 — Eight Running Application Pods: Gateway Two Containers
- [ ] 15 — Seven ClusterIP Application Services with No External Exposure
- [ ] 16 — NGINX Controller Ready and Ingress Host/Path Rules
- [ ] 17 — Local Host Resolution and Host-header / curl --resolve Test
- [ ] 18 — API Gateway Root Response Through NGINX Ingress
- [ ] 19 — Admin and Member Registration Responses (Demo Accounts)
- [ ] 20 — Successful Admin and Member Login (JWT Values Hidden)
- [ ] 21 — Membership Create, View and Update Through Gateway
- [ ] 22 — Payment Create, View and Update Through Gateway
- [ ] 23 — Gym Class Create, List and Update Through Gateway
- [ ] 24 — Booking Create, Paginated List and Cancel Through Gateway
- [ ] 25 — Wrong Password Returns 401
- [ ] 26 — Missing JWT Returns 401
- [ ] 27 — Invalid JWT Returns 401
- [ ] 28 — Member on Admin-only Route Returns 403
- [ ] 29 — Ownership Restriction Returns 403
- [ ] 30 — Membership Service Has Two Ready EndpointSlice Addresses
- [ ] 31 — Repeated Authenticated /server Responses Identify Both Replica Pods
- [ ] 32 — Same Request Log Record Read from Gateway and Sidecar Shared Mount
- [ ] 33 — Log-reader Sidecar Stdout Shows Real Gateway Requests
- [ ] 34 — Atlas Ping from a Kubernetes Pod and Ready Database Probes
- [ ] 35 — Existing Atlas Collections Contain Demo Records (Secrets Hidden)
- [ ] 36 — Atlas Record Persists After Membership Pod Replacement
- [ ] 37 — Local Tests and Kubernetes Server-side YAML Validation
- [ ] 38 — Final Documentation and Source Repository Changes

For screenshot 31, Service balancing is connection-based: do not invent strict alternating responses. If a step fails, include its real status in the verification record and resolve it before marking it complete. An /etc/hosts override is local name resolution, not proof of public DNS ownership. emptyDir is shared temporary storage, not a persistent volume.
