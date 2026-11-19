# Gym Management System — Work Completed and Changes Made

This document records the Kubernetes final-project work and subsequent Docker archive cleanup completed on 18 November 2026. It describes the existing application, repository changes, environment actions, observed tests, and remaining work. Results refer to the checks performed during this session; they are not a new live health check each time this document is opened.

## 1. Purpose and preserved behavior

The existing CLD 376 midterm backend was prepared for a local Kubernetes final-project demonstration using Docker Desktop, Minikube, NGINX Ingress, and the existing MongoDB Atlas database.

The application was preserved rather than replaced. No frontend or MongoDB container was added. Existing routes, controllers, schemas, JWT permissions, ownership checks, and database names were retained. Original Dockerfiles, dependency manifests, lockfiles, Compose configurations, and EC2 deployment instructions were not changed. Existing database records were not deleted.

The original [README.md](./README.md) received links to the final-project documentation. Its midterm deployment instructions remain available.

## 2. Repository audit

Before implementation, the following were inspected:

- All seven services' Express applications, startup files, routes, controllers, dependencies and Dockerfiles.
- Mongoose connection configuration, models, JWT middleware, roles and ownership restrictions.
- Gateway proxy configuration, request-body streaming, mount-path restoration and membership round-robin behavior.
- Docker Compose configurations, EC2 deployment files and Docker build exclusions.
- Existing root HTTP liveness routes and the absence of database-aware readiness routes.
- Mac architecture, Docker Desktop, Docker Buildx, Minikube and kubectl availability.
- Existing Docker Hub image manifests and CPU platform support.

Each database service connects through its existing `MONGO_URI` before opening its HTTP listener. Login issues one-hour JWTs. The gateway already accepted a single membership URL and membership already reported `SERVER_NAME`; these existing features made Kubernetes service discovery and replica identification possible without rewriting business controllers.

## 3. Application code changes

### Gateway access logging

Modified [api-gateway/app.js](./api-gateway/app.js) to install the new [accessLog.js](./api-gateway/middleware/accessLog.js) middleware.

The middleware:

- Activates only when `ACCESS_LOG_FILE` is configured, preserving ordinary Compose behavior when it is absent.
- Creates the log directory/file and fails startup if the configured location cannot be opened.
- Records completed requests with timestamp, method, known route prefix, HTTP status and duration.
- Excludes request bodies, query strings, authorization headers, JWTs, passwords and user identifiers.
- Rotates the active log at approximately 5 MiB, retaining one previous file.
- Bounds the pending write queue and reports a generic write failure without printing request data.

Kubernetes sets the destination to `/app/logs/access.log`. Logging remains a demonstration feature rather than a guaranteed audit ledger: records can be dropped under heavy backpressure, and final queued writes are not explicitly drained on shutdown.

### Database-aware readiness

Added `GET /readyz` to the six backend applications:

| Modified application | Added behavior |
| --- | --- |
| [registration-service/app.js](./registration-service/app.js) | Mongoose connection readiness |
| [login-service/app.js](./login-service/app.js) | Mongoose connection readiness |
| [membership-service/app.js](./membership-service/app.js) | Mongoose connection readiness |
| [payment-service/app.js](./payment-service/app.js) | Mongoose connection readiness |
| [class-service/app.js](./class-service/app.js) | Mongoose connection readiness |
| [booking-service/app.js](./booking-service/app.js) | Mongoose connection readiness |

Each returns HTTP 200 with `{"ready":true}` when Mongoose reports connected, otherwise HTTP 503 with `{"ready":false}`. The existing root `/` routes remain process liveness endpoints. Keeping database readiness separate from liveness avoids restarting a healthy HTTP process merely because Atlas temporarily disconnects.

The gateway does not expose these backend readiness routes as a new public business API.

### Gateway routing and membership identity

No changes were necessary to the existing [gateway service configuration](./api-gateway/config/services.js), [proxy routes](./api-gateway/routes/proxyRoutes.js), or [membership controller](./membership-service/controllers/membershipController.js).

The new Kubernetes ConfigMap supplies one membership Service DNS URL instead of two EC2 IP addresses. The membership Deployment supplies the Pod name through the existing `SERVER_NAME` setting. Existing EC2 round-robin configuration remains usable in the old deployment.

## 4. Kubernetes YAML added

Created the [k8s/](./k8s/) directory with plain declarative resources. Kustomize assembles the existing YAML files; no Helm chart or imperative resource-generation workflow was introduced.

| File or group | Purpose |
| --- | --- |
| [00-namespace.yaml](./k8s/base/00-namespace.yaml) | Namespace `gym-management` |
| [01-config.yaml](./k8s/base/01-config.yaml) | Nonsecret production settings and internal service URLs |
| [kustomization.yaml](./k8s/base/kustomization.yaml) | Explicit inventory of the 17 base resources |
| [ingress.yaml](./k8s/base/ingress.yaml) | NGINX host/path routing for `gym.aupp.com` |
| [secret.example.yaml](./k8s/templates/secret.example.yaml) | Safe placeholder Secret, outside the automatically applied base |
| [k8s/README.md](./k8s/README.md) | Manifest layout and application order |

Seven Deployments and seven ClusterIP Services were added:

| Service | Deployment | Service YAML | Port | Replicas |
| --- | --- | --- | ---: | ---: |
| Gateway | [Deployment](./k8s/base/deployment-api-gateway.yaml) | [Service](./k8s/base/service-api-gateway.yaml) | 5050 | 1 |
| Registration | [Deployment](./k8s/base/deployment-registration-service.yaml) | [Service](./k8s/base/service-registration-service.yaml) | 5001 | 1 |
| Login | [Deployment](./k8s/base/deployment-login-service.yaml) | [Service](./k8s/base/service-login-service.yaml) | 5002 | 1 |
| Membership | [Deployment](./k8s/base/deployment-membership-service.yaml) | [Service](./k8s/base/service-membership-service.yaml) | 5003 | 2 |
| Payment | [Deployment](./k8s/base/deployment-payment-service.yaml) | [Service](./k8s/base/service-payment-service.yaml) | 5004 | 1 |
| Class | [Deployment](./k8s/base/deployment-class-service.yaml) | [Service](./k8s/base/service-class-service.yaml) | 5005 | 1 |
| Booking | [Deployment](./k8s/base/deployment-booking-service.yaml) | [Service](./k8s/base/service-booking-service.yaml) | 5006 | 1 |

The result is eight steady-state application Pods and nine application containers, including the gateway logging sidecar. Kubernetes system and Ingress controller Pods are additional.

### Common deployment settings

- Startup and liveness probes use verified root `/` routes; backend readiness uses `/readyz`.
- Each application requests 100m CPU and 128Mi memory, limited to 500m CPU and 256Mi memory.
- The sidecar requests 10m CPU and 16Mi memory, limited to 100m CPU and 32Mi memory.
- Containers use non-root UID/GID 1000, read-only root filesystems, dropped capabilities, no privilege escalation and RuntimeDefault seccomp.
- Pod service-account token mounting is disabled; fsGroup 1000 grants access to the shared log directory.
- Rolling updates allow one extra Pod and zero unavailable Pods per Deployment.
- Local application images use `imagePullPolicy: Never`; they must already exist inside Minikube.

No backend Service has a public port, NodePort or LoadBalancer. ClusterIP alone does not prevent access by another Pod or cluster administrator; enforced NetworkPolicies were not added.

## 5. Secret template and sensitive configuration

The referenced [secret.example.yaml](./k8s/templates/secret.example.yaml) contains placeholders only. It defines an Opaque Secret named `gym-secrets` in `gym-management` with these keys:

| Key | Destination |
| --- | --- |
| `REGISTRATION_MONGO_URI` | Registration container's `MONGO_URI` |
| `LOGIN_MONGO_URI` | Login container's `MONGO_URI` |
| `MEMBERSHIP_MONGO_URI` | Membership containers' `MONGO_URI` |
| `PAYMENT_MONGO_URI` | Payment container's `MONGO_URI` |
| `CLASS_MONGO_URI` | Class container's `MONGO_URI` |
| `BOOKING_MONGO_URI` | Booking container's `MONGO_URI` |
| `JWT_SECRET` | Login and all JWT-verifying services |

Separate URI keys preserve each service's existing Atlas database configuration. Registration and login must access the same users database. JWT-verifying services must share login's signing secret.

A private local Secret was generated from the existing service environment files, written with mode 0600, and applied declaratively. Values were not printed or included in documentation. The template is deliberately excluded from the base so applying the base cannot overwrite real credentials with placeholders. Do not apply the example directly.

Updated [.gitignore](./.gitignore) to exclude `.env.*`, the entire private Kubernetes local directory, local YAML variants and log files. Existing `.env` exclusions remain. Demo credentials and tokens are also kept only in the ignored local directory. Kubernetes Secrets are not automatically secure merely because their data can be base64-encoded.

No MongoDB container, replacement database, migration, or destructive database operation was created. Atlas credentials and existing JWT secrets were not changed.

## 6. Ingress, DNS and request flow

The configured path is:

```text
Client / Postman
  -> local resolution or Host header for gym.aupp.com
  -> NGINX Ingress controller
  -> api-gateway ClusterIP Service :5050
  -> API Gateway Pod
  -> internal Kubernetes Service DNS
  -> backend Pod
  -> existing MongoDB Atlas
```

The Ingress defines Prefix paths `/register`, `/login`, `/memberships`, `/payments`, `/classes`, `/bookings`, `/server` and `/`. Every path forwards to the gateway Service on port 5050. No Ingress rule bypasses the gateway.

Local name resolution and path routing were documented separately: DNS maps names to addresses; NGINX and the gateway route HTTP paths. The course's fanout requirement is demonstrated while retaining the central gateway.

Because macOS Docker-driver networking may not expose the Minikube node IP directly, a loopback-only port-forward to the **NGINX controller** was used:

```bash
kubectl --context gym-final -n ingress-nginx port-forward service/ingress-nginx-controller 8080:80 --address=127.0.0.1
```

A request using `curl --resolve` returned gateway JSON through NGINX. An unrelated Host header returned 404. No public DNS record or system hosts file was changed. The guide explains optional local hosts mapping and Postman setup.

For Postman without a hosts entry, use `http://127.0.0.1:8080` and `Host: gym.aupp.com`. The port-forward must be running; processes opened during an earlier session may have ended and need restarting.

## 7. Shared log volume

The gateway Deployment contains two containers sharing an `emptyDir` named `access-logs`:

1. The gateway writes completed HTTP access records to `/app/logs/access.log`.
2. The read-only BusyBox log-reader waits for the file and tails it to stdout, following rotation.

The volume has a 100Mi size limit. Matching real log records were read from the gateway mount, sidecar mount and sidecar stdout.

The volume survives a container restart within the same Pod, but not Pod replacement or deletion. It is temporary shared storage. No PVC was implemented or claimed; Atlas data persistence is independent of gateway logs.

## 8. Docker Desktop and Minikube actions

The Mac reported `arm64`. Docker, Minikube, kubectl and Node were installed, but Docker Desktop's daemon was initially stopped. After Docker Desktop was opened, the daemon became available.

Observed versions were Docker Desktop 4.69.0, Docker Engine 29.4.0, Minikube 1.39.0 and kubectl 1.34.1.

A separate profile named `gym-final` was created, preserving the old profile. An initial request for 6 GiB exceeded Docker Desktop's approximately 4 GiB allocation. The successful configuration used 2 CPUs and 3072Mi memory, Kubernetes 1.34.1 and containerd 2.3.4:

```bash
minikube start -p gym-final --driver=docker --cpus=2 --memory=3072 --kubernetes-version=v1.34.1
```

The first startup downloaded the Kubernetes preload. NGINX Ingress was enabled through the Minikube addon. Namespace, private Secret and application YAML were applied. The first Ingress validation encountered a starting admission webhook; retrying after controller readiness succeeded without disabling validation.

## 9. Architecture-compatible images

The existing registry audit observed:

| Existing Docker Hub tag | Platforms observed |
| --- | --- |
| `draven168/gym-api-gateway:v3` | linux/amd64 and linux/arm64 |
| `draven168/gym-booking:v2` | linux/amd64 and linux/arm64 |
| `draven168/gym-registration:v1` | linux/amd64 only |
| `draven168/gym-login:v1` | linux/amd64 only |
| `draven168/gym-membership:v1` | linux/amd64 only |
| `draven168/gym-payment:v1` | linux/amd64 only |
| `draven168/gym-class:v1` | linux/amd64 only |

All seven updated applications were built with Docker Buildx for **both** `linux/amd64` and `linux/arm64` using their existing Dockerfiles. Each was tagged locally as `gym/<service-name>:k8s-v1`.

- ARM64 supports this Apple Silicon Mac's Minikube and Graviton EC2 instances.
- AMD64 supports Intel/AMD Ubuntu EC2 instances.
- All fourteen application-import checks passed in actual containers: seven services on two architectures, with networking disabled.
- Both variants were loaded into Docker Desktop, and the images were imported into Minikube.
- No new image was pushed to Docker Hub; existing registry tags were not overwritten.
- Updated local tags therefore cannot be assumed pullable from Docker Hub until explicitly published.

Ubuntu EC2 itself has not been deployed or tested. Container runtime loading on both architectures was tested locally. Future publishing should use a new tag and include both platforms; it was not performed automatically.

## 10. Scripts added and retained

| Script | Purpose and side effects |
| --- | --- |
| [build-minikube-images.sh](./scripts/build-minikube-images.sh) | Build all seven images from source directly in the chosen Minikube profile; does not require exported archives |
| [build-portable-images.sh](./scripts/build-portable-images.sh) | Build both architectures and export OCI archives when explicitly needed; does not push |
| [export-ubuntu-images.sh](./scripts/export-ubuntu-images.sh) | Export locally loaded images as standard AMD64 Docker archives and checksums; `EC2_ARCH=arm64` selects ARM64 |
| [inspect-image-platforms.sh](./scripts/inspect-image-platforms.sh) | Inspect original registry image platform manifests |
| [prepare-k8s-secret.cjs](./scripts/prepare-k8s-secret.cjs) | Read existing service environment files, validate required settings/shared JWT consistency, and write private YAML without displaying values; refuses overwrites |
| [test-kubernetes-local.cjs](./scripts/test-kubernetes-local.cjs) | Run local HTTP checks without connecting to or writing Atlas |
| [validate-k8s.rb](./scripts/validate-k8s.rb) | Validate YAML inventory, replicas, selectors, ports, probes, Secret references, Ingress targets and shared mounts |
| [smoke-ingress.cjs](./scripts/smoke-ingress.cjs) | Run live API checks through Ingress; requires `--write-demo-data` because it creates uniquely named demo records |
| [verify-live-readonly.cjs](./scripts/verify-live-readonly.cjs) | Read the saved demo membership and optionally observe membership replicas without creating more records |

The live test client was corrected to use Node's native HTTP API so its explicit Host header is preserved. The first client attempt failed at routing before creating any demo records; the corrected complete run passed.

No essential deployment script was removed during cleanup.

## 11. Verification performed

### Static and local checks

- Parsed and semantically validated 17 base YAML resources.
- Rendered Kustomize output and passed the final server-side Kubernetes dry run.
- Checked JavaScript and shell syntax, editor diagnostics and Git whitespace.
- Passed both local Node HTTP tests: verified backend root routes, readiness 503 while disconnected, missing/invalid JWT rejection, gateway path/method/query/body/auth preservation and sensitive-value exclusion from logs.
- Verified original Compose and EC2 files had no changes.

### Live Kubernetes checks

- Seven Deployments ready, including membership at 2/2.
- Eight application Pods Running/Ready; gateway at 2/2 containers.
- Seven application Services ClusterIP-only.
- NGINX host/path routing to the gateway, including root HTTP 200 and wrong-host 404.
- Membership service DNS resolution and two ready endpoint addresses.
- Atlas ping from a Kubernetes Pod and working database readiness probes.
- Real shared log records visible from both gateway containers and sidecar stdout.

### Live API checks

The complete smoke run made **52 HTTP checks** with expected statuses, including 30 `/server` requests.

| API behavior | Observed statuses |
| --- | --- |
| Admin/Member registration | 201 each |
| Admin/Member login | 200 each, JWT issued |
| Wrong password | 401 |
| Missing JWT / invalid JWT | 401 / 401 |
| Member on Admin-only route | 403 |
| Member reading another user's payments | 403 |
| Membership create / view / update | 201 / 200 / 200 |
| Payment create / list / update | 201 / 200 / 200 |
| Class create / list / update | 201 / 200 / 200 |
| Booking create / paginated list / cancel | 201 / 200 / 200 |
| Authenticated `/server` | 200 |

The tests created one unique demo Admin, one demo Member, and demo membership/payment/class/booking records in the existing Atlas database. The booking was cancelled during testing. Existing records were not deleted or intentionally modified. Private credentials, JWTs and demo IDs were stored only in the ignored local directory.

### Membership balancing and database persistence

A burst of requests initially reached the same membership Pod because the gateway reused an upstream connection. A later request reached the second Pod after the connection had been idle. Both replicas were therefore observed through Ingress and the gateway; strict request-by-request alternation was not claimed.

The membership Deployment was then restarted. Both replacement Pods became ready, and the same saved membership `_id` and updated `quarterly` plan were read successfully. This verified Atlas persistence across Pod replacement without changing the routing to explicit Pod IPs.

## 12. Archive creation and cleanup

The archives were intentional portability exports, not a consequence of forgetting to open Docker Desktop.

Initially generated:

- Seven dual-architecture OCI archives.
- Seven standard AMD64 Docker archives for Ubuntu EC2.
- One associated SHA256SUMS file.

Before deletion, the archive names, sizes and references were inventoried. Both architecture variants of every service were verified in Docker Desktop, all seven image tags were verified in Minikube, and no active archive-loading/export process was found. Manifests reference image tags, not archive paths. The only script references generate optional exports; the normal Minikube build workflow uses source.

The 14 redundant archives and obsolete checksum file were deleted. No image layers, containers, volumes or Minikube state were removed.

| Space accounting | Result |
| --- | ---: |
| Deleted archive content | 1,151,706,624 bytes, about 1.15 GB / 1.073 GiB |
| Deleted checksum file | 714 bytes |
| Allocated filesystem blocks released | 1,205,714,944 bytes, about 1.123 GiB |

Filesystem snapshots and shared extents can make the operating system's free-space change differ from this block accounting. The complete per-archive size inventory is in [KUBERNETES-VERIFICATION.md](./KUBERNETES-VERIFICATION.md).

After cleanup, all fourteen Docker architecture variants remained inspectable, Minikube retained all seven image tags, and all eight Pods remained ready with zero restarts. Gateway and saved membership requests passed through NGINX again. The old port-forward had ended between turns and was reopened for that check; no workload rebuild or repair was required.

The archive directory was empty after cleanup. The preserved export scripts can regenerate files later when an EC2 transfer is actually needed. No `docker system prune`, volume deletion, container removal or Minikube reset was run.

## 13. Documentation added or updated

| Document | Contents |
| --- | --- |
| [README.md](./README.md) | Added links to the final-project guide and screenshot checklist |
| [KUBERNETES-FINAL-README.md](./KUBERNETES-FINAL-README.md) | Full audit, architecture, YAML explanation, Mac/Minikube setup, Atlas Secret handling, Ingress/DNS, logs, API/Postman tests, troubleshooting, cleanup and Ubuntu image portability |
| [FINAL-PROJECT-SCREENSHOT-CHECKLIST.md](./FINAL-PROJECT-SCREENSHOT-CHECKLIST.md) | Exact final-report screenshot headings and evidence precautions |
| [KUBERNETES-VERIFICATION.md](./KUBERNETES-VERIFICATION.md) | Observed versions, build results, deployment/API results, limitations and archive deletion inventory |
| [k8s/README.md](./k8s/README.md) | Manifest layout and safe apply order |
| [read.md](./read.md) | This consolidated record of work and changes |

Earlier build sections in the verification record describe the historical exports; its later cleanup section records their deletion. The main guide also has a cleanup notice so archive regeneration paths are not mistaken for currently retained files.

## 14. Known limitations and remaining work

- Actual Ubuntu EC2 deployment and publishing updated images to Docker Hub remain future steps. Original published tags are preserved, but five original backend v1 tags do not support ARM64.
- Existing public registration accepts `role: admin`. This was documented rather than silently changing the coursework API. Recommended future change: force public registrations to member and provision administrators through a trusted separate flow.
- Inherited update validation, booking capacity/class-existence checks and payment-processor integration were not redesigned.
- Builds reported inherited high-severity npm findings: four for gateway dependencies and two for backend dependencies. No automatic potentially breaking dependency upgrade was applied.
- The community ingress-nginx controller is retired as documented with an official reference in the final guide; it was retained for the requested isolated coursework demonstration. A maintained controller or Gateway API should be considered for production.
- TLS, enforced NetworkPolicies, persistent log storage and production log shipping were not implemented.
- No public DNS record or system hosts-file change was made. Local resolution instructions and Host-header testing were provided.
- Screenshots and final report captures must be made from real outputs. No screenshots or successful EC2 results were fabricated.

## 15. Useful commands after this work

Inspect the existing deployment without rebuilding:

```bash
minikube -p gym-final status
kubectl --context gym-final -n gym-management get deployments,pods,services,ingress
```

Open access through NGINX in a terminal that stays running:

```bash
kubectl --context gym-final -n ingress-nginx port-forward service/ingress-nginx-controller 8080:80 --address=127.0.0.1
```

Test the gateway from another terminal:

```bash
curl --resolve gym.aupp.com:8080:127.0.0.1 http://gym.aupp.com:8080/
```

Run local checks without creating Atlas records:

```bash
node --test scripts/test-kubernetes-local.cjs
ruby --disable-gems scripts/validate-k8s.rb
```

Only when necessary, rebuild the local Minikube images or regenerate portable dual-platform exports:

```bash
# Native images built directly into Minikube:
bash scripts/build-minikube-images.sh

# Optional portable OCI archives for both architectures; creates new large files:
bash scripts/build-portable-images.sh

# Optional AMD64 Docker exports from images already loaded in Docker:
bash scripts/export-ubuntu-images.sh
```

Do not rebuild, export or publish merely to inspect a healthy deployment. Use the full deployment guide for fresh installation and private Secret configuration.
