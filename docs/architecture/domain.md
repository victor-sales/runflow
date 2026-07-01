# Arquitetura de Domínio

## Entidades principais

### Workout

Representa um treino realizado.

Campos principais:

- id
- type
- status
- startedAt
- endedAt
- totalDistance
- totalDuration
- avgPace

### WorkoutPoint

Representa um ponto de GPS capturado durante um treino.

Campos principais:

- id
- workoutId
- segmentId
- latitude
- longitude
- accuracy
- altitude
- speed
- timestamp

### WorkoutSegment

Representa uma etapa de um treino, especialmente em treinos intervalados.

Tipos:

- WARMUP
- RUN
- REST
- COOLDOWN

### IntervalTemplate

Representa um modelo de treino intervalado criado pelo usuário.

Exemplo:

```txt
6x400m
Aquecimento: 10 min
Tiro: 400m
Descanso: 1 min
Desaquecimento: 5 min
```

## Regras gerais

- Unidades internas devem ser padronizadas.
- Distância em metros.
- Duração em segundos.
- Pace em segundos por km.
- Datas em ISO string.
