# 🕵️ Deep Scout Report: 2026-02-04

## 0. Identity & Intent
- **Name:** UV Python Template
- **Description:** A web-first starter template for Python projects. Pre-configured with `uv`, FastAPI, Ruff, and modern tooling.
- **Domain:** Software Development / Web Template

## 1. Executive Identification
- **Archetype:** Polyrepo
- **Runtime:** Python 3.14
- **Manager:** uv

## 2. Structural Topology
- **Core/Kernel:** src/app/
- **Interface:** src/app/main.py (FastAPI)

## 3. Engineering Contracts
- **Testing:** pytest
- **Styling:** Ruff (for formatting)
- **State:** N/A (Backend API)

## 4. Workflows
- **Dev:** just dev
- **Build:** just preview (builds Docker image)
- **Test:** just test
- **Check:** just lint, just format