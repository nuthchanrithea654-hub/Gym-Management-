#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
profile="${MINIKUBE_PROFILE:-gym-final}"
minikube -p "$profile" status
for service in api-gateway registration-service login-service membership-service payment-service class-service booking-service; do
  minikube -p "$profile" image build -t "gym/${service}:k8s-v1" "./${service}"
done
minikube -p "$profile" image ls
