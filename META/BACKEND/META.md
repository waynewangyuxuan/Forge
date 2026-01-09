# BACKEND - Index

This folder contains the backend architecture documentation for Forge's Electron main process.

## Purpose
Defines the layered architecture, data models, interfaces, and config-driven design patterns for the backend system.

## Files

| File | Purpose |
|------|---------|
| [OVERVIEW.md](OVERVIEW.md) | Architecture overview - layered structure (IPC/Application/Domain/Infrastructure), data classification, directory layout |
| [DOMAIN.md](DOMAIN.md) | Domain layer design - pure business logic engines (StateMachine, TodoParser, PromptRenderer, etc.) with zero dependencies |
| [INTERFACES.md](INTERFACES.md) | Interface definitions - Repository and Adapter interfaces enabling dependency injection and testability |
| [DATA-MODEL.md](DATA-MODEL.md) | Data model - SQLite schema, entity relationships, content structure, and data lifecycle |
| [CONFIG-DRIVEN.md](CONFIG-DRIVEN.md) | Config-driven design - YAML-based state machines, prompts, and execution configuration |
