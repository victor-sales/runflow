# ADR 001 — Arquitetura Local-First

## Status

Aceito.

## Contexto

O MVP precisa validar a experiência principal do app sem custo de infraestrutura e sem complexidade de autenticação.

## Decisão

O app não terá backend, login ou sincronização em nuvem no MVP.

Todos os dados serão armazenados localmente no dispositivo.

## Consequências positivas

- Menor custo.
- Menor complexidade.
- Desenvolvimento mais rápido.
- Mais privacidade.
- App funciona sem internet.

## Consequências negativas

- Sem backup automático.
- Dados ficam presos ao dispositivo.
- Sincronização futura exigirá migração arquitetural.
