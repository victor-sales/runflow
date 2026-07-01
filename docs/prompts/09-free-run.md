# Prompt 09 — Corrida livre

Use este prompt no Codex.

```txt
Leia o spec.md e o AGENTS.md.

Implemente a primeira versão funcional da tela de Corrida Livre.

Tela:
- src/app/workout/free-run.tsx

Requisitos:
- pedir permissão de localização em foreground;
- iniciar captura de GPS;
- exibir tempo total;
- exibir distância total;
- exibir pace médio;
- exibir pace atual, se possível;
- permitir pausar;
- permitir retomar;
- permitir finalizar;
- permitir cancelar;
- ao finalizar, salvar treino no SQLite;
- salvar pontos de GPS usando WorkoutRepository;
- ignorar pontos com accuracy maior que 30 metros;
- usar a active-workout.store;
- não implementar background location;
- não implementar treino intervalado;
- não adicionar mapa ainda.

Critérios técnicos:
- componente não deve conter cálculo complexo;
- usar utils para cálculo de distância e pace;
- usar repository para persistência;
- evitar any.

Ao final:
- liste arquivos alterados;
- explique como testar no dispositivo;
- indique riscos ou limitações.
```
