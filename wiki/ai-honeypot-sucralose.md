---
layout: wiki
title: "AI Honeypot - Sucralose"
permalink: /wiki/ai-honeypot-sucralose/
---

**Sucralose** is a lightweight, low-interaction security honeypot framework designed to detect and log unauthorized exploration by autonomous AI agents, scrapers, and malicious actors targeting machine learning deployments.

Instead of serving real model inference endpoints, Sucralose acts as a "decoy" (or sweetener) mimicking popular AI serving APIs.

## Supported Lures

The honeypot mocks several standard AI APIs to intercept different payloads:
1. **[[Ollama Lures]]**: Emulates the `/api/generate` and `/api/chat` endpoints, trapping attempts to query or extract system prompts.
2. **BentoML Lures**: Replicates BentoML container entry points to catch automated scanning of model pipelines.
3. **Langflow / Flow Lures**: Simulates open Langflow dashboard configurations to trap hackers trying to execute arbitrary code via flow graphs.

## Core Mechanics

When an agent triggers a decoy:
- **Telemetry Capture**: Logs the full HTTP headers, system-prompt queries, temperature overrides, and LLM orchestration metadata.
- **Dynamic Responses**: Returns plausible, semi-random responses or generic validation errors to keep the attacker exploring (and logging) longer.
- **Alert Trigger**: Dispatches details of the intrusion to Slobberdog's centralized monitoring console.

*See also: [[Ollama Lures]] for configuration details.*
