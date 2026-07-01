# Prompt 05 — Repositories

Use este prompt no Codex.

```txt
Leia o spec.md e o AGENTS.md.

Implemente repositories tipados para acesso ao SQLite.

Arquivos:
- src/features/workout/workout.repository.ts
- src/features/interval-training/interval-template.repository.ts

WorkoutRepository deve permitir:
- createWorkout
- updateWorkout
- finishWorkout
- cancelWorkout
- getWorkoutById
- listCompletedWorkouts
- deleteWorkout
- addWorkoutPoint
- addWorkoutPoints
- getWorkoutPoints
- addWorkoutSegments
- getWorkoutSegments

IntervalTemplateRepository deve permitir:
- createIntervalTemplate
- updateIntervalTemplate
- getIntervalTemplateById
- listIntervalTemplates
- deleteIntervalTemplate

Requisitos:
- não executar SQL fora dos repositories;
- mapear snake_case do banco para camelCase no TypeScript;
- evitar any;
- tratar erros básicos;
- não implementar UI;
- não implementar GPS.

Ao final:
- liste métodos criados;
- explique exemplos de uso.
```
