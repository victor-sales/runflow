# AGENTS.md

## Contexto

Este projeto é um aplicativo mobile de corrida desenvolvido com:

- React Native
- Expo
- TypeScript
- Expo Router
- NativeWind
- SQLite
- Zustand
- React Hook Form
- Zod

O projeto segue arquitetura local-first.

Todos os requisitos funcionais estão descritos em `spec.md`.

Antes de qualquer alteração:

1. Ler `spec.md`
2. Seguir o escopo da fase atual
3. Não implementar funcionalidades fora do MVP

---

## Regras Arquiteturais

### Separação de responsabilidades

UI:

```txt
src/components
src/app
```

Domínio:

```txt
src/features
```

Persistência:

```txt
src/database
src/features/*/*.repository.ts
```

Estado global:

```txt
src/store
```

Utilitários:

```txt
src/utils
```

---

## Regras obrigatórias

- Usar TypeScript.
- Evitar `any`.
- Não criar backend.
- Não criar autenticação.
- Não criar sincronização em nuvem.
- Não adicionar dependências sem justificativa.
- Não executar SQL em componentes React.
- Não colocar regra de negócio complexa em componentes React.
- Não acessar SQLite fora de repositories.
- Não acessar Expo APIs dentro do motor intervalado.
- Não implementar integração com Strava no MVP.

---

## Treino Intervalado

Toda lógica de treino intervalado deve permanecer em:

```txt
src/features/interval-training
```

O motor intervalado deve:

- ser independente da UI;
- ser independente do SQLite;
- ser independente do Zustand;
- ser testável isoladamente.

---

## GPS

Ao trabalhar com localização:

- ignorar `accuracy > 30`;
- usar Haversine para distância;
- não calcular pace usando apenas o último ponto;
- usar janela móvel para pace atual;
- considerar perda temporária de sinal;
- considerar saltos irreais de localização.

---

## TypeScript

- Evitar `any`.
- Criar tipos explícitos.
- Usar union types para estados conhecidos.
- Usar `zod` para formulários.
- Derivar tipos de formulário a partir do schema quando possível.

---

## Testes

Prioridade alta:

- cálculo de distância;
- cálculo de pace;
- formatação de pace;
- geração de segmentos;
- motor intervalado;
- filtro de pontos GPS inválidos.

---

## Processo de implementação

Antes de implementar:

1. Ler `spec.md`.
2. Identificar a fase do backlog.
3. Criar plano curto.
4. Implementar apenas o solicitado.

Após implementar:

1. Listar arquivos alterados.
2. Explicar decisões relevantes.
3. Explicar como testar.
4. Informar limitações conhecidas.

---

## Validação

Executar quando aplicável:

```bash
npm run lint
```

```bash
npm test
```

```bash
npx expo-doctor
```
