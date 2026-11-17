---
layout: wiki
title: "Dropbear Vault"
permalink: /wiki/
---

Welcome to the **Dropbear Labs Knowledge Vault** — my personal, open-source digital garden. This is a repository of my notes, raw ideas, active investigations, and quick research memos. 

I edit these files locally using **Obsidian** and sync them directly to GitHub. 

## Navigation Vectors

Choose a node to start exploring:

- **AI Security & Honeypots**
  - [[AI Honeypot - Sucralose]]: The overview and architecture of my decoy systems.
  - [[Ollama Lures]]: Active analysis of Ollama endpoints and model extraction attempts.
- **Physical Computing & Electronics**
  - `arduino102`: LED rings and microcontroller basics (see the [Workshops Portal](/workshops/)).
- **Creative Practice & Ideas**
  - Slide deck on [Provocations](/provocations/) — AI and Creative Practice.

---

## Vault Publishing Guide

To add notes to this vault:
1. Write a markdown file locally inside your Obsidian Vault's `wiki/` directory.
2. Link pages together using standard wiki link format: `[[Note Name]]` or `[[Note Name|Custom Display Alias]]`.
3. Commit and push your changes. 
4. The automated GitHub Action pre-compiler will inspect your files, add Jekyll front-matter dynamically, resolve the links, and publish them to GitHub Pages!

> [!TIP]
> Since we run a custom pre-compiler on GitHub Actions, you do **not** need to manually add Jekyll front-matter or formatting blocks to your Obsidian files. Write raw Markdown as you normally would, and they will compile perfectly.
