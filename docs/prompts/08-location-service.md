# Prompt 08 — Serviço de localização

Use este prompt no Codex.

```txt
Leia o spec.md e o AGENTS.md.

Implemente a camada de localização.

Arquivos:
- src/features/location/location-permissions.ts
- src/features/location/location.service.ts
- src/features/location/location-task.ts

Requisitos:
- solicitar permissão de localização em foreground;
- preparar estrutura para background location, mas não ativar no fluxo principal ainda;
- criar função para iniciar tracking;
- criar função para parar tracking;
- normalizar pontos de localização para o tipo LocationPoint;
- filtrar pontos com accuracy maior que 30 metros;
- não salvar no SQLite diretamente dentro do location.service;
- não implementar tela completa de corrida livre ainda.

Ao final:
- explique como o serviço deve ser consumido pela tela de corrida livre;
- liste limitações conhecidas de foreground/background.
```
