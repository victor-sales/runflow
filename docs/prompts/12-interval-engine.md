# Prompt 12 — Motor intervalado

Use este prompt no Codex.

```txt
Leia o spec.md e o AGENTS.md.

Implemente o motor de treino intervalado.

Arquivo:
- src/features/interval-training/interval-engine.ts

Requisitos:
- receber um IntervalTemplate;
- gerar segmentos WARMUP, RUN, REST e COOLDOWN;
- pular WARMUP se warmupDuration for zero;
- pular COOLDOWN se cooldownDuration for zero;
- alternar RUN e REST conforme shotsCount;
- não adicionar REST depois do último RUN;
- calcular progresso por TIME;
- calcular progresso por DISTANCE;
- identificar segmento atual;
- avançar para o próximo segmento;
- informar quando o treino foi concluído;
- não acessar React;
- não acessar SQLite;
- não acessar Expo APIs;
- implementar como função/classe testável.

Adicione testes unitários para:
- template 6x400m com aquecimento e desaquecimento;
- template sem aquecimento;
- template sem desaquecimento;
- avanço de segmento por tempo;
- avanço de segmento por distância.

Ao final:
- liste API pública do motor;
- mostre exemplo de uso;
- rode testes se possível.
```
