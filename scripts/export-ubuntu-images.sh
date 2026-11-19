#!/usr/bin/env bash
# Standard single-platform Docker archives for Ubuntu, including classic image stores.
# Requires the portable images to have been loaded into the local Docker engine.
set -euo pipefail
cd "$(dirname "$0")/.."
architecture="${EC2_ARCH:-amd64}"
case "$architecture" in amd64|arm64) ;; *) echo 'EC2_ARCH must be amd64 or arm64' >&2; exit 1 ;; esac
output_dir="k8s/local/images/ubuntu-${architecture}"
mkdir -p "$output_dir"
for service in api-gateway registration-service login-service membership-service payment-service class-service booking-service; do
  docker image save --platform "linux/${architecture}" \
    --output "${output_dir}/${service}-k8s-v1.docker.tar" "gym/${service}:k8s-v1"
done
(cd "$output_dir" && shasum -a 256 ./*.docker.tar > SHA256SUMS)
printf 'Ubuntu %s Docker archives and checksums: %s\n' "$architecture" "$output_dir"
