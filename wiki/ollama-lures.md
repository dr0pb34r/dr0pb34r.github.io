---
layout: wiki
title: "Ollama Lures"
permalink: /wiki/ollama-lures/
---

This node outlines the design and behavior of Ollama decoy endpoints implemented within the [[AI Honeypot - Sucralose]] architecture.

## Endpoint Emulation

Ollama runs on port `11434` by default. Malware search crawlers (like Shodan scans) look for active instances of this port to hijack inference resources.

Sucralose exposes the following routes:
- `/api/tags`: Mimics model inventories. Returns fake models (e.g. `llama3:70b`, `mistral:latest`, `custom-deepseek-coder`).
- `/api/generate` / `/api/chat`: Traps prompt injections and exploration vectors.

## Configuration Schema (Example)

A typical configuration profile for an Ollama lure specifies fake response tokens and response delays:

```yaml
lure:
  type: ollama
  port: 11434
  enabled: true
  decoy_models:
    - name: "llama3:latest"
      digest: "sha256:6a0740a6b7e0..."
    - name: "deepseek-coder:6.7b"
      digest: "sha256:b89f81a704da..."
  behavior:
    delay_ms: 150
    simulate_errors_rate: 0.05
```

## Logging Outputs

When a request arrives, Sucralose logs:
- **System Prompts**: Detects if the agent is attempting to override parameters.
- **Payload Extraction**: Inspects requests with high numbers of context window requests, suggesting extraction scripts.

*Return to the [[AI Honeypot - Sucralose]] node.*
