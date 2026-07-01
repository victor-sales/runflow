# Prompt 04 — SQLite e migrations

Use este prompt no Codex.

```txt
Leia o spec.md e o AGENTS.md.

Implemente a camada inicial de SQLite com TypeScript.

Requisitos:
- configurar expo-sqlite;
- criar src/database/db.ts;
- criar src/database/migrate.ts;
- criar src/database/schema.ts se fizer sentido;
- criar src/database/migrations/001_initial_schema.ts;
- criar tabelas:
  - workouts
  - workout_points
  - workout_segments
  - interval_templates
- criar controle de migrations;
- criar função para executar migrations na inicialização do app;
- tipar funções públicas;
- não implementar repositories ainda;
- não implementar telas novas.

Ao final:
- liste arquivos criados/alterados;
- explique onde a migration é chamada;
- explique como testar que o banco foi criado.
```
