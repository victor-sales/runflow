# Arquitetura de Banco Local

## Banco

Usar SQLite com `expo-sqlite`.

## Tabelas

- workouts
- workout_points
- workout_segments
- interval_templates
- migrations

## Convenções

Banco:

```txt
snake_case
```

TypeScript:

```txt
camelCase
```

## Camadas

```txt
database/
  db.ts
  migrate.ts
  migrations/

features/*/*.repository.ts
```

## Regras

- Telas não executam SQL.
- Services não devem criar SQL inline quando houver repository.
- Repositories mapeiam banco para domínio.
- Operações críticas devem usar transaction.
- Migrations devem ser idempotentes.

## Pontos de atenção

Ao finalizar um treino, salvar:

1. workout;
2. workout_points;
3. workout_segments, quando existirem;
4. métricas calculadas.
