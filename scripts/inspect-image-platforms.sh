#!/usr/bin/env bash
set -euo pipefail
for image in draven168/gym-api-gateway:v3 draven168/gym-registration:v1 draven168/gym-login:v1 draven168/gym-membership:v1 draven168/gym-payment:v1 draven168/gym-class:v1 draven168/gym-booking:v2 busybox:1.37; do
  printf '\n%s\n' "$image"
  docker buildx imagetools inspect "$image"
done
