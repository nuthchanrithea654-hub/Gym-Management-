#!/usr/bin/env bash
# OCI archives retain both Linux architectures without publishing credentials/images.
set -euo pipefail
cd "$(dirname "$0")/.."
output_dir="k8s/local/images"
mkdir -p "$output_dir"
for service in api-gateway registration-service login-service membership-service payment-service class-service booking-service; do
  docker buildx build \
    --platform linux/amd64,linux/arm64 \
    --tag "gym/${service}:k8s-v1" \
    --output "type=oci,dest=${output_dir}/${service}-k8s-v1.oci.tar" \
    "./${service}"
done
printf '\nPortable multi-platform archives are in %s\n' "$output_dir"
