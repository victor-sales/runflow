# GPS, Distância e Pace

## GPS

A localização é o maior risco técnico do app.

## Regras

- Solicitar foreground location primeiro.
- Background location fica para etapa posterior.
- Ignorar pontos com `accuracy > 30`.
- Ignorar pontos sem latitude/longitude válidos.
- Considerar perda temporária de sinal.
- Considerar saltos irreais de localização.

## Distância

Usar Haversine entre pontos consecutivos.

## Pace médio

```txt
pace = duração em segundos / distância em km
```

Se distância for zero, retornar `null`.

## Pace atual

Não usar apenas o último ponto.

Usar janela móvel de 10 a 20 segundos.

## Unidades internas

- Distância: metros.
- Duração: segundos.
- Pace: segundos por quilômetro.
