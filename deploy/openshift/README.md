# Deploying ACE Studio on OpenShift

## Prerequisites

- OpenShift cluster with `oc` CLI configured
- ACE-Step 1.5 backend deployed as a separate service (needs GPU node)
- Container registry access (OpenShift internal or external like quay.io)

## Step 1: Deploy the Backend

The ACE-Step 1.5 backend requires GPU access. Deploy it first:

```bash
# Example: run on a GPU node
oc new-app --name=acestep-api \
  --docker-image=your-registry/acestep-api:latest \
  --env=ACESTEP_CONFIG_PATH=acestep-v15-xl-base \
  --env=ACESTEP_LM_MODEL_PATH=acestep-5Hz-lm-0.6B

oc expose svc/acestep-api --port=8001
```

Or use the official ACE-Step container image if available.

## Step 2: Build the Frontend Image

From the project root:

```bash
docker build -f deploy/openshift/Dockerfile -t your-registry/ace-studio:latest .
docker push your-registry/ace-studio:latest
```

Or use OpenShift Source-to-Image:

```bash
oc new-build --name=ace-studio --binary --image-stream=node:22
oc start-build ace-studio --from-dir=. --follow
```

## Step 3: Deploy

Edit `deployment.yaml` to set:
- The correct image path
- `NEXT_PUBLIC_API_URL` pointing to your backend service name

```bash
# Update the image reference in deployment.yaml, then:
oc apply -f deploy/openshift/deployment.yaml
oc apply -f deploy/openshift/service.yaml
oc apply -f deploy/openshift/route.yaml
```

## Step 4: Verify

```bash
oc get route ace-studio
# Visit the URL shown in the HOST column
```

## Configuration

Set `NEXT_PUBLIC_API_URL` in `deployment.yaml` to match your backend service:

- Same namespace: `http://acestep-api:8001`
- Different namespace: `http://acestep-api.other-namespace.svc:8001`
- External: `https://your-api-domain.com`

## Resource Requirements

The frontend is lightweight (no GPU needed):

| Resource | Request | Limit |
|----------|---------|-------|
| CPU | 100m | 500m |
| Memory | 256Mi | 512Mi |

The backend (ACE-Step 1.5) needs a GPU node with 8-24 GB VRAM depending on model choice.
