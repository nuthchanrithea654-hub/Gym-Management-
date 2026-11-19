# Observed verification — 2026-11-18

All results below were observed on this Mac and the separate `gym-final` Minikube profile. No screenshots were fabricated. See [the final guide](./KUBERNETES-FINAL-README.md) for reproduction and [the screenshot checklist](./FINAL-PROJECT-SCREENSHOT-CHECKLIST.md) for report captures.

## Environment and builds

| Check | Observed result |
| --- | --- |
| Host CPU | macOS ARM64 (`uname -m`: arm64) |
| Docker | Docker Desktop 4.69.0 / Engine 29.4.0, server linux/arm64, running |
| Minikube / kubectl | Minikube 1.39.0, kubectl 1.34.1 |
| Isolated cluster | gym-final, Kubernetes 1.34.1, containerd 2.3.4, 2 CPUs/3072Mi; node Ready |
| Resource adjustment | Initial 6144Mi request exceeded Docker Desktop's approximately 4 GiB allocation; 3072Mi worked |
| Original registry platforms | Gateway v3 and booking v2: AMD64 + ARM64; registration/login/membership/payment/class v1: AMD64 only |
| Updated portable builds | Seven images built successfully for both linux/amd64 and linux/arm64 |
| Image runtime checks | All fourteen application-import checks passed: seven services × two architectures, executed with no network |
| Ubuntu archives | Seven dual-architecture OCI archives; seven additional standard AMD64 Docker archives with SHA256SUMS |
| Minikube image import | All seven updated application images present in cluster image store |
| Published images | No registry push and no existing Docker Hub tag overwritten |

Archives live under ignored `k8s/local/images/`; AMD64 Docker archives are in `ubuntu-amd64/`. App-import checks verify dependencies load in the actual Linux images, not an actual EC2 deployment. The images have not been deployed to Ubuntu EC2 yet.

## Kubernetes and infrastructure

| Check | Observed result |
| --- | --- |
| YAML static checks | 17 resources validated: seven Deployments/Services, eight replicas, matching selectors/ports/probes/Secret references and gateway-only Ingress targets |
| Kustomize and server schema | Base rendered; final full `--dry-run=server -k k8s/base` passed |
| Deployments | All seven rolled out; membership 2/2, each other service 1/1 |
| Application Pods | Eight Running/Ready; gateway 2/2 containers, backends 1/1 |
| Application Services | Seven ClusterIP Services, no external IPs or published backend ports |
| NGINX controller | Running/Ready; course-required community ingress-nginx v1.15.1 |
| Ingress | gym.aupp.com, nginx class, all specified paths target gateway:5050 |
| Local domain test | `curl --resolve gym.aupp.com:8080:127.0.0.1 http://gym.aupp.com:8080/` returned 200 gateway JSON through NGINX |
| Wrong Host | `Host: unrelated.invalid` returned NGINX 404 |
| DNS inside namespace | Gateway resolved membership-service to 10.102.167.177 |
| Membership endpoints | Two ready Pod addresses observed: 10.244.0.11 and 10.244.0.10 before rollout |
| Atlas | Pod-side MongoDB `ping` returned `Atlas ping OK`; all database readiness probes passed |
| Shared volume | Matching timestamped /server and root access-log records read from both containers and sidecar stdout |
| Secrets | Prepared from existing per-service values, shared JWT consistency checked; private file mode 0600; Git ignore verified; no values printed |

NGINX's admission webhook initially refused connections while the controller image was starting. After readiness, both server-side validation and Ingress apply succeeded without disabling validation. Controller access was via loopback-only port-forward to NGINX, not directly to gateway or backend Services. The port-forward must stay running or be restarted for Postman. No system hosts file or public DNS record was changed; use the documented local hosts mapping or explicit Host header.

## Live API checks through NGINX and gateway

The final automated live smoke run completed **52 HTTP checks with expected status codes**, including 30 /server calls. It added one uniquely named demo Admin, one demo Member, and demo membership/payment/class/booking records to the existing Atlas database. The booking was cancelled as part of the test. Existing records and collections were not deleted. Private test credentials, tokens, IDs and detailed status evidence are under ignored `k8s/local/`; do not include them in screenshots.

| Operation | Observed |
| --- | --- |
| Gateway root | 200 |
| Admin and Member registration | 201 for each |
| Admin and Member login | 200 and JWT for each |
| Wrong password | 401 |
| Missing / invalid JWT | 401 / 401 |
| Member attempts Admin-only operation | 403 |
| Member attempts another user's payment read | 403 |
| Membership create / read / update | 201 / 200 / 200 |
| Payment create / list / update | 201 / 200 / 200 |
| Class create / list / update | 201 / 200 / 200 |
| Booking create / paginated list / cancel | 201 / 200 / 200; array and X-Page verified |
| /server | 200 on every authenticated request |
| Atlas persistence | Same membership `_id` and updated `quarterly` plan read after replacing membership Pods |

### Replica observations

The initial burst of 30 requests used one pooled upstream connection and returned `membership-service-74c8bbc8d5-hw6p6`. A later read-only request, after idle connection expiry, returned `membership-service-74c8bbc8d5-j97bb`. Both running replicas were observed through the same public Ingress/gateway route. Responses did not strictly alternate; this matches connection-level Kubernetes Service balancing. No explicit Pod IP routing was added.

The membership Deployment was then restarted for the persistence test. Both replacement replicas rolled out successfully, and the same saved Atlas document remained readable with its updated value. A terminating old Pod briefly remained visible during cleanup; this is normal rolling-update behavior.

## Local checks and reproducibility

- Both local Node HTTP test suites passed, including six backend roots and disconnected readiness, missing/invalid JWT rejection, all seven gateway route prefixes, body/method/query/auth forwarding, and log redaction.
- Changed JavaScript and shell scripts passed syntax checks; editor diagnostics reported no errors.
- `git diff --check` passed; original Compose and EC2 files have no diff.
- No application schemas, JWT business permissions, existing demo credentials or EC2 image references were changed.

```bash
node --test scripts/test-kubernetes-local.cjs
ruby --disable-gems scripts/validate-k8s.rb
bash -n scripts/*.sh
kubectl kustomize k8s/base
kubectl --context gym-final apply --dry-run=server -k k8s/base
git diff --check
```

## Remaining manual report work and limits

Capture your real screenshots and Postman views using the checklist. Review Atlas collections privately, hiding password hashes and secrets. Public DNS ownership, TLS, actual Ubuntu EC2 deployment and a persistent log PVC have not been claimed or tested. Existing public admin registration is retained for compatibility and documented with a recommended safe fix. Builds reported inherited npm high-severity findings (four gateway, two backend dependencies); no automatic breaking dependency upgrade was applied. The community ingress-nginx controller is retired as documented in the guide; this setup is an isolated course demo.

## Archive cleanup — 2026-11-18

All seven image tags and both AMD64/ARM64 variants were verified in Docker Desktop before deletion. All seven tags were verified in Minikube, whose node architecture is ARM64. No active image loading/export process referenced the archives. Kubernetes manifests reference image tags, not archive paths. Optional export scripts recreate archives; the native Minikube build script builds from source and does not consume archives. Source, Dockerfiles, YAML, Secret template, private Secret, and all scripts were preserved. Nothing was rebuilt, pushed, pruned, or reset.

| Deleted archive | Bytes |
| --- | ---: |
| `k8s/local/images/api-gateway-k8s-v1.oci.tar` | 125208576 |
| `k8s/local/images/ubuntu-amd64/api-gateway-k8s-v1.docker.tar` | 62720000 |
| `k8s/local/images/registration-service-k8s-v1.oci.tar` | 102795264 |
| `k8s/local/images/ubuntu-amd64/registration-service-k8s-v1.docker.tar` | 51082752 |
| `k8s/local/images/login-service-k8s-v1.oci.tar` | 102961664 |
| `k8s/local/images/ubuntu-amd64/login-service-k8s-v1.docker.tar` | 51167744 |
| `k8s/local/images/membership-service-k8s-v1.oci.tar` | 102886912 |
| `k8s/local/images/ubuntu-amd64/membership-service-k8s-v1.docker.tar` | 51130368 |
| `k8s/local/images/payment-service-k8s-v1.oci.tar` | 102886912 |
| `k8s/local/images/ubuntu-amd64/payment-service-k8s-v1.docker.tar` | 51130368 |
| `k8s/local/images/class-service-k8s-v1.oci.tar` | 102886912 |
| `k8s/local/images/ubuntu-amd64/class-service-k8s-v1.docker.tar` | 51130368 |
| `k8s/local/images/booking-service-k8s-v1.oci.tar` | 129063936 |
| `k8s/local/images/ubuntu-amd64/booking-service-k8s-v1.docker.tar` | 64654848 |

Deleted 14 archives: 1151706624 logical bytes (1.073 GiB), plus the obsolete 714-byte SHA256SUMS. Filesystem allocated blocks released: 1205714944 bytes (1.123 GiB); Docker Desktop VM/container layers remain allocated as intended. Filesystem snapshots or shared extents can make the system-wide free-space increase differ.

Both variants remain locally usable. The original Docker Hub image references and Buildx rebuild scripts are retained; the new gym/*:k8s-v1 tags have not been pushed to Docker Hub. Existing five backend v1 Docker Hub tags are AMD64-only; rebuild via the retained dual-platform script for ARM64 rather than assuming those old tags are multi-architecture.

Post-cleanup checks passed: all fourteen Docker architecture variants remain inspectable; Minikube retains all seven image tags; all eight application Pods remain Running/Ready with zero restarts; gateway root returned HTTP 200 through NGINX; the saved membership matched its original `_id` and updated plan through the same route. The earlier port-forward had ended between turns and was reopened for this check; no workload repair or rebuild was required. YAML semantic checks, shell syntax and `git diff --check` passed. The archive directory contains no remaining files.
