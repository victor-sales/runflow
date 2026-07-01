# ADR 002 — SQLite Local

## Status

Aceito.

## Contexto

O app precisa armazenar treinos, pontos de GPS, segmentos e templates intervalados localmente.

## Decisão

Usar SQLite local com `expo-sqlite`.

## Motivos

- Dados relacionais.
- Boa estrutura para treinos e segmentos.
- Persistência local confiável.
- Suporte adequado no Expo.
- Facilita consultas históricas.

## Regras

- SQL apenas na camada de database/repositories.
- Banco usa `snake_case`.
- TypeScript usa `camelCase`.
- Usar migrations.
- Repositories retornam tipos de domínio.
