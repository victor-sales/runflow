# ADR 004 — TypeScript

## Status

Aceito.

## Contexto

O domínio do app envolve estados, segmentos, métricas e regras que podem gerar bugs se não forem bem tipados.

## Decisão

Usar TypeScript em todo código de aplicação.

## Motivos

- Mais segurança.
- Melhor autocomplete.
- Melhor manutenção.
- Facilita uso com Codex.
- Reduz erros em entidades de treino, GPS e segmentos.

## Regras

- Evitar `any`.
- Criar tipos de domínio.
- Usar union types.
- Usar Zod nos formulários.
