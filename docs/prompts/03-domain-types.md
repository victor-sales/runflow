# Prompt 03 — Tipos de domínio

Use este prompt no Codex.

```txt
Leia o spec.md e o AGENTS.md.

Crie os tipos de domínio principais em TypeScript.

Arquivos esperados:
- src/features/workout/workout.types.ts
- src/features/interval-training/interval.types.ts
- src/features/location/location.types.ts

Tipos mínimos:
- WorkoutType
- WorkoutStatus
- SegmentType
- TargetType
- Workout
- WorkoutSegment
- WorkoutPoint
- IntervalTemplate
- ActiveWorkoutStatus
- ActiveWorkoutState
- LocationPoint

Requisitos:
- evitar any;
- exportar tipos necessários;
- manter nomes alinhados ao spec.md;
- não implementar banco;
- não implementar UI;
- não implementar GPS.

Ao final:
- liste arquivos criados;
- explique como os tipos serão usados nas próximas etapas.
```
