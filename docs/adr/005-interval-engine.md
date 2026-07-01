# ADR 005 — Motor Intervalado Separado da UI

## Status

Aceito.

## Contexto

Treinos intervalados têm regras próprias de geração, progresso, troca de segmento e finalização.

## Decisão

Criar um motor intervalado isolado em:

```txt
src/features/interval-training/interval-engine.ts
```

## Regras

O motor não deve acessar:

- React;
- SQLite;
- Zustand;
- Expo APIs;
- navegação.

## Motivos

- Facilita testes.
- Evita acoplamento.
- Reduz bugs na UI.
- Permite evolução para novos tipos de treino.
