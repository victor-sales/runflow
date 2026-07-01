# Prompt 07 — Store de treino ativo

Use este prompt no Codex.

```txt
Leia o spec.md e o AGENTS.md.

Implemente a store de treino ativo com Zustand.

Arquivo:
- src/store/active-workout.store.ts

Requisitos:
- usar tipos definidos no domínio;
- controlar estado do treino ativo;
- actions mínimas:
  - startWorkout
  - pauseWorkout
  - resumeWorkout
  - finishWorkout
  - cancelWorkout
  - addPoint
  - setCurrentSegment
  - updateMetrics
  - resetWorkout
- não persistir dados na store nesta etapa;
- não acessar SQLite diretamente na store;
- não implementar GPS;
- evitar any.

Ao final:
- explique responsabilidade da store;
- explique o que não deve ficar na store.
```
