# Prompt 13 — Execução guiada

Use este prompt no Codex.

```txt
Leia o spec.md e o AGENTS.md.

Implemente a tela de execução de treino intervalado.

Tela:
- src/app/workout/interval/active.tsx

Requisitos:
- iniciar treino a partir de um template existente;
- usar interval-engine;
- criar Workout do tipo INTERVAL;
- criar WorkoutSegments no início do treino;
- exibir segmento atual;
- exibir repetição atual;
- exibir progresso do segmento;
- exibir distância total;
- exibir tempo total;
- exibir pace atual;
- exibir próximo segmento;
- capturar GPS;
- associar pontos ao segment_id atual;
- vibrar ao trocar de segmento usando expo-haptics;
- finalizar automaticamente após o último segmento;
- salvar resumo dos segmentos;
- permitir pausar, retomar, cancelar e finalizar manualmente.

Critérios:
- componente não deve conter regras complexas do motor;
- persistência deve passar por repositories;
- cálculos devem usar utils;
- evitar any.

Ao final:
- liste arquivos alterados;
- explique como testar com um template 6x400m.
```
