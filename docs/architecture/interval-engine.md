# Arquitetura do Motor Intervalado

## Objetivo

Controlar treinos intervalados sem depender de UI, banco, navegação ou APIs Expo.

## Entrada

Um `IntervalTemplate`.

## Saída

Uma sequência de segmentos.

## Segmentos

- WARMUP
- RUN
- REST
- COOLDOWN

## Regras de geração

- Se `warmupDuration` for zero, não gerar WARMUP.
- Gerar RUN conforme `shotsCount`.
- Gerar REST entre tiros.
- Não gerar REST depois do último tiro.
- Se `cooldownDuration` for zero, não gerar COOLDOWN.

## Progresso

### TIME

Comparar duração decorrida com `targetValue`.

### DISTANCE

Comparar distância acumulada do segmento com `targetValue`.

## API pública sugerida

```ts
createIntervalSegments(template)
createIntervalEngine(segments)
getCurrentSegment()
updateProgress(input)
advanceSegment()
pause()
resume()
cancel()
isCompleted()
```

## Testes obrigatórios

- Geração 6x400m.
- Template sem aquecimento.
- Template sem desaquecimento.
- Avanço por tempo.
- Avanço por distância.
- Não gerar descanso após último tiro.
