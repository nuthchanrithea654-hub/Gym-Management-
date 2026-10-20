# Deploying the sandbox stack to EC2

For a three-instance deployment, follow [EC2-THREE-INSTANCE.md](./EC2-THREE-INSTANCE.md). This guide is for running the full stack on a single EC2 host.

The EC2 deployment pulls the images from Docker Hub; it does not build them. The API gateway is the only published service and listens on host port `5050` by default.

## 1. Build and push the images

From the project root on the machine that has the source and Docker installed, use the same Docker Hub namespace and tag configured for the deployment:

```sh
docker login
TAG=v2 docker buildx bake -f docker-compose.yml \
  --set '*.platform=linux/amd64,linux/arm64' --push \
  api-gateway booking-service
```

Use a new tag when publishing an update so you can roll back by selecting the previous tag.

## 2. Prepare the EC2 instance

Install Docker Engine and the Docker Compose plugin on the instance. Copy `docker-compose.ec2.yml` to a deployment directory. Create these secret files there; do not put production secrets in the repository:

| File | Required variables |
| --- | --- |
| `registration-service/.env` | `MONGO_URI` |
| `login-service/.env` | `MONGO_URI`, `JWT_SECRET` |
| `membership-service/.env` | `MONGO_URI`, `JWT_SECRET` |
| `payment-service/.env` | `MONGO_URI`, `JWT_SECRET` |
| `class-service/.env` | `MONGO_URI`, `JWT_SECRET` |
| `booking-service/.env` | `MONGO_URI`, `JWT_SECRET` |

The `JWT_SECRET` must match across services that issue or verify the same tokens. Each `MONGO_URI` must point to a database reachable from EC2. If the Docker Hub repositories are private, run `docker login` on EC2 before pulling.

Create a deployment `.env` beside the Compose file to choose your Hub account. The updated gateway and booking images use `v2`; the unchanged services continue using `v1`:

```dotenv
REGISTRY=draven168
GATEWAY_PORT=5050
```

## 3. Start the stack

From the deployment directory on EC2:

```sh
docker compose -f docker-compose.ec2.yml pull
docker compose -f docker-compose.ec2.yml up -d
docker compose -f docker-compose.ec2.yml ps
```

In the EC2 security group, allow inbound TCP `5050` from your current public IP for the lab. Then open `http://EC2-PUBLIC-IP:5050/`. The IP changes when an instance is stopped and restarted unless you assign an Elastic IP.

To inspect startup failures, use `docker compose -f docker-compose.ec2.yml logs --tail=100`. To stop the stack, use `docker compose -f docker-compose.ec2.yml down`.
