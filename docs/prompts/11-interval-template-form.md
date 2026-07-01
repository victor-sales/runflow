# Prompt 11 — Templates intervalados

Use este prompt no Codex.

```txt
Leia o spec.md e o AGENTS.md.

Implemente criação e listagem de templates de treino intervalado.

Telas:
- src/app/workout/interval/index.tsx
- src/app/workout/interval/create.tsx

Requisitos:
- listar templates salvos;
- criar novo template;
- usar react-hook-form;
- validar com zod;
- campos:
  - nome;
  - aquecimento em minutos;
  - tipo do tiro: DISTANCE ou TIME;
  - valor do tiro;
  - quantidade de tiros;
  - tipo do intervalo: DISTANCE ou TIME;
  - valor do intervalo;
  - desaquecimento em minutos;
- salvar usando IntervalTemplateRepository;
- não implementar execução do treino ainda.

Critérios:
- evitar any;
- criar schema do formulário;
- derivar tipo do formulário a partir do zod se possível;
- converter minutos para segundos antes de salvar quando aplicável.

Ao final:
- liste arquivos alterados;
- explique como criar e visualizar um template.
```
