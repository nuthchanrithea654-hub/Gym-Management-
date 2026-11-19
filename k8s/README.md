# Kubernetes files

Apply `base/00-namespace.yaml`, then your ignored `local/secret.yaml`, then `kubectl apply -k k8s/base` from the repository root. The example Secret is intentionally outside the base so placeholders cannot accidentally overwrite the live Secret during normal deployment. Never apply the example directly.

All resources are YAML. Kustomize only assembles these plain manifests; it does not install charts or generate secrets. See [the final guide](../KUBERNETES-FINAL-README.md) for the complete ordered procedure.

`base/` contains the Namespace, ConfigMap, seven Deployments, seven ClusterIP Services and Ingress. The gateway Pod has two containers sharing an `emptyDir`. Membership has two Pods. There is no MongoDB workload. Preserve each service's existing Atlas URI and database name in the Secret template's separate URI keys; registration and login must access the same users collection. Never replace these URIs with a new database merely for the demonstration.
