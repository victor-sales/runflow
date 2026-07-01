# Prompt 14 — Resumo pós-treino

Use este prompt no Codex.

```txt
Leia o spec.md e o AGENTS.md.

Implemente a tela de resumo pós-treino.

Tela:
- src/app/workout/summary/[id].tsx

Requisitos:
- carregar treino por ID;
- mostrar distância total;
- mostrar duração total;
- mostrar pace médio;
- mostrar tipo de treino;
- se for treino intervalado, listar segmentos:
  - tipo;
  - repetição;
  - distância;
  - duração;
  - pace médio;
- funcionar para FREE_RUN e INTERVAL;
- não implementar mapa ainda.

Critérios:
- usar WorkoutRepository;
- não executar SQL diretamente na tela;
- usar formatadores de distância, duração e pace.

Ao final:
- explique como a tela é acessada após finalizar um treino.
```
