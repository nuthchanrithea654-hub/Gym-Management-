# Deploy the gym stack across three EC2 instances

The normal `docker-compose.yml` is for running the whole stack on one Docker host. For the three-instance lab, use the per-host files below. They communicate over EC2 private IPs; a Compose network does not span hosts.

I placed registration and login on EC2-1 because those services were not assigned to one of the three instances in your message.

| Instance | Services | Compose file |
| --- | --- | --- |
| EC2-1 | API gateway, registration, login | `compose.ec2-api.yml` |
| EC2-2 | Membership instance 1, payment | `compose.ec2-services-2.yml` |
| EC2-3 | Membership instance 2, class, booking | `compose.ec2-services-3.yml` |

The API image `draven168/gym-api-gateway:v3` and booking image `draven168/gym-booking:v2` are multi-architecture images for `linux/amd64` and `linux/arm64`. The other services use their existing `v1` tags.

To publish a later gateway change, build and push its new tag from the repository root with `docker login` completed:

```sh
TAG=v4 docker buildx bake -f docker-compose.yml \
  --set '*.platform=linux/amd64,linux/arm64' --push api-gateway
```

For a later booking change, use `TAG=v3` and target `booking-service`, then update that tag in `compose.ec2-services-3.yml`.

## Configure networking

Use each instance's **private IPv4 address** for service-to-service traffic. In the EC2 security groups, allow these inbound ports only from the API instance's security group:

- EC2-2: TCP `5003` and `5004`
- EC2-3: TCP `5003`, `5005`, and `5006`

On EC2-1, allow TCP `5050` from the clients that need to reach the API (for a lab, preferably your current public IP). Do not open the service ports on EC2-2 or EC2-3 to the public internet. The database must allow connections from all three EC2 private addresses.

## Prepare files on each instance

Install Docker Engine and the Docker Compose plugin. Copy the applicable `compose.ec2-*.yml` file and the listed service folders from the repository to the same deployment directory on that instance. Create these secret files in that directory; keep real secrets out of Git:

| Instance | Secret files and variables |
| --- | --- |
| EC2-1 | `registration-service/.env`: `MONGO_URI`; `login-service/.env`: `MONGO_URI`, `JWT_SECRET` |
| EC2-2 | `membership-service/.env`: `MONGO_URI`, `JWT_SECRET`; `payment-service/.env`: `MONGO_URI`, `JWT_SECRET` |
| EC2-3 | `membership-service/.env`: `MONGO_URI`, `JWT_SECRET`; `class-service/.env`: `MONGO_URI`, `JWT_SECRET`; `booking-service/.env`: `MONGO_URI`, `JWT_SECRET` |

Use the same JWT secret for services validating the same login tokens. Put this Compose `.env` beside `compose.ec2-api.yml` on EC2-1, replacing the example addresses with the other instances' private IPv4 addresses:

```dotenv
REGISTRY=draven168
MEMBERSHIP_1_PRIVATE_IP=10.0.1.20
MEMBERSHIP_2_PRIVATE_IP=10.0.2.30
PAYMENT_PRIVATE_IP=10.0.1.20
CLASS_PRIVATE_IP=10.0.2.30
BOOKING_PRIVATE_IP=10.0.2.30
GATEWAY_PORT=5050
```

If the Docker Hub repositories are private, run `docker login` on each instance before pulling.

## Pull and start each host

Run these commands from each instance's deployment directory:

```sh
# EC2-1
docker compose -f compose.ec2-api.yml pull
docker compose -f compose.ec2-api.yml up -d
docker compose -f compose.ec2-api.yml ps

# EC2-2
docker compose -f compose.ec2-services-2.yml pull
docker compose -f compose.ec2-services-2.yml up -d
docker compose -f compose.ec2-services-2.yml ps

# EC2-3
docker compose -f compose.ec2-services-3.yml pull
docker compose -f compose.ec2-services-3.yml up -d
docker compose -f compose.ec2-services-3.yml ps
```

For logs, run `docker compose -f <that-host-compose-file> logs --tail=100` on the relevant instance.

The API endpoint is `http://<EC2-1-public-IP>:5050/`. If you change an image tag later, update the matching per-host Compose file, copy it to that instance, then run `pull` and `up -d` again.
