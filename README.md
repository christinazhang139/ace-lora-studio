# ACE LoRA Christina Studio

Web frontend for [ACE-Step 1.5](https://github.com/ace-step/ACE-Step-1.5), the open-source music generation model (CVPR 2026, MIT license).

Built by [Christina Zhang](https://github.com/christinazhang139).

Two apps in one monorepo:

- **Studio** — LoRA fine-tuning workspace: upload your songs, train a style adapter, compare results with spectral analysis
- **Muse** — Music generation and continuation: describe what you want, optionally upload a melody, get a full arrangement

![Architecture](https://img.shields.io/badge/Next.js_16-black?logo=next.js) ![License](https://img.shields.io/badge/license-MIT-green)

## What ACE-Step 1.5 Is

ACE-Step is a hybrid music generation model with two components:

| Component | Role | Options |
|-----------|------|---------|
| **DiT** (Diffusion Transformer) | Generates audio | 2B params (turbo/base/sft) or 4B XL variants |
| **LM** (Language Model, Qwen3-based) | Understands lyrics, generates metadata | 0.6B, 1.7B, or 4B |

The model generates 10s to 10min audio, supports 50+ languages for lyrics, and covers 1000+ instruments and styles.

### Model Variants

**DiT models** (pick one based on your GPU):

| Model | Params | Speed | Quality | HuggingFace |
|-------|--------|-------|---------|-------------|
| `acestep-v15-turbo` | 2B | Fast (8 steps) | Good | [ACE-Step/Ace-Step1.5](https://huggingface.co/ACE-Step/Ace-Step1.5) |
| `acestep-v15-base` | 2B | Normal (50 steps) | Better | [ACE-Step/acestep-v15-base](https://huggingface.co/ACE-Step/acestep-v15-base) |
| `acestep-v15-xl-base` | 4B | Normal (50 steps) | Best | [ACE-Step/acestep-v15-xl-base](https://huggingface.co/ACE-Step/acestep-v15-xl-base) |
| `acestep-v15-xl-turbo` | 4B | Fast (8 steps) | Very good | [ACE-Step/acestep-v15-xl-turbo](https://huggingface.co/ACE-Step/acestep-v15-xl-turbo) |

**LM models** (for lyrics understanding and auto-labeling):

| Model | Base | Size | HuggingFace |
|-------|------|------|-------------|
| `acestep-5Hz-lm-0.6B` | Qwen3-0.6B | ~0.6 GB | [ACE-Step/acestep-5Hz-lm-0.6B](https://huggingface.co/ACE-Step/acestep-5Hz-lm-0.6B) |
| `acestep-5Hz-lm-1.7B` | Qwen3-1.7B | ~1.7 GB | [ACE-Step/acestep-5Hz-lm-1.7B](https://huggingface.co/ACE-Step/acestep-5Hz-lm-1.7B) |
| `acestep-5Hz-lm-4B` | Qwen3-4B | ~4 GB | [ACE-Step/acestep-5Hz-lm-4B](https://huggingface.co/ACE-Step/acestep-5Hz-lm-4B) |

### GPU Requirements

| VRAM | What you can run |
|------|-----------------|
| 4-8 GB | 2B turbo only, no LM, CPU offload |
| 8-12 GB | 2B models + 0.6B LM |
| 12-16 GB | 2B models + 1.7B LM, XL with offload |
| 16-24 GB | XL models + 1.7B LM |
| 24 GB+ | XL models + 4B LM, full quality |

This project was developed and tested on an RTX 4090 (24 GB) with `acestep-v15-xl-base` (4B DiT) + `acestep-5Hz-lm-0.6B`.

## Features

### Studio (LoRA Training)

1. **Dataset** — Upload audio files, scan server directories, auto-label metadata (genre, BPM, key, lyrics)
2. **Preprocess** — Convert audio to training tensors
3. **Train** — Fine-tune LoRA or LoKR adapters with real-time loss curves
4. **Export** — Export trained weights as `.safetensors`, download to your computer
5. **A/B Compare** — Generate the same prompt with and without LoRA, listen side by side
6. **Spectral Compare** — FFT frequency analysis comparing LoRA output, base output, and your reference audio with cosine similarity scoring

### Muse (Music Generation)

- Text-to-music and melody continuation
- Track class selection (vocals, drums, bass, guitar, piano, strings, etc.)
- BPM and key detection with manual override
- LoRA adapter loading for style transfer
- Generation history

## Quick Start

### Prerequisites

You need the ACE-Step 1.5 backend running. Follow the setup at [ACE-Step 1.5](https://github.com/ace-step/ACE-Step-1.5):

```bash
git clone https://github.com/ace-step/ACE-Step-1.5.git
cd ACE-Step-1.5
uv run acestep-api --host 0.0.0.0 --port 8001
```

Models download automatically on first run.

### Option 1: Run Locally (npm)

```bash
git clone https://github.com/christinazhang139/ace-lora-studio.git
cd ace-lora-studio
npm install
npm run build
npm start
```

Open http://localhost:3000. The frontend auto-connects to the backend at `http://localhost:8001`.

To use a different backend URL:

```bash
NEXT_PUBLIC_API_URL=http://your-backend:8001 npm start
```

### Option 2: Docker Compose

```bash
git clone https://github.com/christinazhang139/ace-lora-studio.git
cd ace-lora-studio
docker compose -f deploy/local/docker-compose.yml up
```

Edit `deploy/local/docker-compose.yml` to point `NEXT_PUBLIC_API_URL` to your backend.

### Option 3: OpenShift / Kubernetes

See [deploy/openshift/README.md](deploy/openshift/README.md) for full instructions.

```bash
# Build and push the image
docker build -f deploy/openshift/Dockerfile -t your-registry/ace-lora-studio:latest .
docker push your-registry/ace-lora-studio:latest

# Deploy
oc apply -f deploy/openshift/
```

## Project Structure

```
ace-lora-studio/
├── packages/ui/        # Shared component library (@ace/ui)
│   └── src/
│       ├── components/ # Button, Card, AudioPlayer, etc.
│       ├── hooks/      # usePolling, useAudioPlayer, useApiHealth
│       └── lib/        # API client, types, constants
├── studio/             # LoRA training app (Next.js)
│   └── app/
│       ├── workflow/   # Main training pipeline UI
│       ├── dataset/    # Dataset management
│       ├── train/      # Training controls
│       └── export/     # Export + comparison
├── muse/               # Music generation app (Next.js)
│   └── app/
│       ├── page.tsx    # Generation interface
│       └── history/    # Generation history
└── deploy/
    ├── local/          # Docker Compose setup
    └── openshift/      # OpenShift/K8s manifests
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8001` | ACE-Step backend API address |
| `NEXT_PUBLIC_API_KEY` | (none) | Optional API authentication key |
| `ACESTEP_SAFE_ROOT` | `$HOME` | Root directory for file download access control |

Copy `.env.example` to `.env.local` to configure.

## Architecture

```
┌─────────────────────┐     HTTP/REST      ┌──────────────────────┐
│                     │ ◄──────────────── │                      │
│  ACE LoRA Christina │                    │   ACE-Step 1.5       │
│   (Next.js)         │ ──────────────── │   (FastAPI + PyTorch) │
│                     │   /v1/training/*   │                      │
│   Port 3000         │   /v1/lora/*       │   Port 8001          │
│                     │   /v1/dataset/*    │                      │
│   - Studio app      │   /release_task    │   - DiT model        │
│   - Muse app        │   /v1/audio        │   - LM model         │
│   - @ace/ui lib     │                    │   - LoRA training     │
│                     │                    │   - Audio generation  │
└─────────────────────┘                    └──────────────────────┘
        Browser                                GPU Server
```

## Tech Stack

- Next.js 16 with React 19
- TypeScript 5.8
- Tailwind CSS 4
- Web Audio API (spectral analysis)
- Canvas API (frequency charts)

## License

MIT. See [LICENSE](LICENSE).

The ACE-Step 1.5 model is also MIT licensed. See [ACE-Step 1.5 License](https://github.com/ace-step/ACE-Step-1.5/blob/main/LICENSE).
