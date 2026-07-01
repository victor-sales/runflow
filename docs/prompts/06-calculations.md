# Prompt 06 — Cálculos e formatadores

Use este prompt no Codex.

```txt
Leia o spec.md e o AGENTS.md.

Implemente utilitários puros de cálculo e formatação.

Arquivos:
- src/utils/distance.ts
- src/utils/pace.ts
- src/utils/time.ts
- src/utils/format.ts

Funções necessárias:
- calculateDistanceBetweenPoints usando Haversine;
- calculateTotalDistance;
- calculateAvgPace;
- calculateCurrentPace usando janela móvel;
- formatPace;
- formatDuration;
- formatDistance.

Requisitos:
- usar TypeScript;
- evitar any;
- funções puras;
- não acessar SQLite;
- não acessar React;
- não acessar Expo APIs;
- tratar distância zero para não gerar Infinity ou NaN.

Adicione testes unitários se já houver estrutura de testes. Se não houver, proponha uma estrutura mínima antes de adicionar dependência.

Ao final:
- liste funções criadas;
- mostre exemplos de entrada e saída;
- rode testes se possível.
```
