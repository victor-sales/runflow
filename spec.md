# spec.md — RunFlow

## 1. Visão do produto

RunFlow é um aplicativo mobile de corrida local-first para registrar treinos, acompanhar métricas básicas e executar treinos intervalados guiados.

A primeira versão não terá login, backend ou sincronização em nuvem. Todos os dados serão armazenados localmente no dispositivo.

O diferencial principal é permitir que o usuário configure treinos de tiro com aquecimento, tiros, intervalos e desaquecimento, recebendo orientação durante a execução.

---

## 2. Objetivos do MVP

O MVP deve permitir que o usuário:

1. inicie uma corrida livre;
2. acompanhe tempo, distância e pace;
3. finalize e salve o treino localmente;
4. consulte histórico local;
5. crie modelos de treino intervalado;
6. execute treino intervalado com orientação por etapas;
7. visualize resumo geral do treino;
8. visualize segmentos de um treino de tiro.

---

## 3. Fora do escopo do MVP

- Login.
- Cadastro de usuário.
- Backend.
- Sincronização em nuvem.
- Feed social.
- Curtidas.
- Comentários.
- Ranking.
- Integração com Strava.
- Integração com smartwatch.
- Planos automáticos.
- IA para recomendação de treino.
- Pagamento.
- Assinatura.
- Versão web.

---

## 4. Stack técnica

- React Native
- Expo
- TypeScript
- Expo Router
- NativeWind
- SQLite local com `expo-sqlite`
- Zustand
- React Hook Form
- Zod
- Expo Location
- Expo Task Manager
- Expo Notifications
- Expo Haptics
- Expo Keep Awake
- React Native Maps
- Lucide React Native
- date-fns

---

## 5. Decisão de UI

A UI do MVP será construída com:

```txt
NativeWind + componentes próprios
```

Motivos:

- flexibilidade visual;
- familiaridade com Tailwind;
- telas fitness exigem layouts específicos;
- evita dependência visual forte de bibliotecas prontas.

Alternativas futuras:

- React Native Paper;
- gluestack-ui;
- Tamagui.

---

## 6. Estrutura de pastas sugerida

```txt
src/
  app/
    _layout.tsx
    index.tsx
    workout/
      index.tsx
      free-run.tsx
      interval/
        index.tsx
        create.tsx
        active.tsx
      summary/
        [id].tsx
    history/
      index.tsx
      [id].tsx
    settings/
      index.tsx

  components/
    ui/
      Button.tsx
      Card.tsx
      Input.tsx
      AppText.tsx
      Screen.tsx
      Header.tsx
      MetricCard.tsx
    workout/
      WorkoutTimer.tsx
      WorkoutDistance.tsx
      WorkoutPace.tsx
      WorkoutControls.tsx
      SegmentProgress.tsx
      SegmentTimeline.tsx
      WorkoutMap.tsx

  features/
    workout/
      workout.repository.ts
      workout.service.ts
      workout-calculator.ts
      workout.constants.ts
      workout.types.ts
    interval-training/
      interval-template.repository.ts
      interval-template.service.ts
      interval-engine.ts
      interval-factory.ts
      interval.constants.ts
      interval.types.ts
    location/
      location.service.ts
      location-task.ts
      location-permissions.ts
      location.types.ts
    history/
      history.service.ts

  database/
    db.ts
    migrate.ts
    schema.ts
    migrations/
      001_initial_schema.ts

  store/
    active-workout.store.ts

  utils/
    distance.ts
    pace.ts
    time.ts
    format.ts
    id.ts
```

---

## 7. Rotas do app

```txt
/                         Home
/workout                  Escolha do tipo de treino
/workout/free-run         Corrida livre
/workout/interval         Lista de treinos intervalados
/workout/interval/create  Criar treino intervalado
/workout/interval/active  Execução de treino intervalado
/workout/summary/:id      Resumo pós-treino
/history                  Histórico
/history/:id              Detalhe do treino
/settings                 Configurações
```

---

## 8. Modelo de dados local

### workouts

```sql
CREATE TABLE IF NOT EXISTS workouts (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  total_distance REAL DEFAULT 0,
  total_duration INTEGER DEFAULT 0,
  avg_pace INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### workout_segments

```sql
CREATE TABLE IF NOT EXISTS workout_segments (
  id TEXT PRIMARY KEY,
  workout_id TEXT NOT NULL,
  type TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  repetition INTEGER,
  target_type TEXT NOT NULL,
  target_value INTEGER NOT NULL,
  actual_distance REAL DEFAULT 0,
  actual_duration INTEGER DEFAULT 0,
  avg_pace INTEGER,
  started_at TEXT,
  ended_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (workout_id) REFERENCES workouts(id)
);
```

### workout_points

```sql
CREATE TABLE IF NOT EXISTS workout_points (
  id TEXT PRIMARY KEY,
  workout_id TEXT NOT NULL,
  segment_id TEXT,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  accuracy REAL,
  altitude REAL,
  speed REAL,
  timestamp TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (workout_id) REFERENCES workouts(id),
  FOREIGN KEY (segment_id) REFERENCES workout_segments(id)
);
```

### interval_templates

```sql
CREATE TABLE IF NOT EXISTS interval_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  warmup_duration INTEGER DEFAULT 0,
  shot_target_type TEXT NOT NULL,
  shot_target_value INTEGER NOT NULL,
  shots_count INTEGER NOT NULL,
  rest_target_type TEXT NOT NULL,
  rest_target_value INTEGER NOT NULL,
  cooldown_duration INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

---

## 9. Tipos principais

```ts
export type WorkoutType = 'FREE_RUN' | 'INTERVAL';

export type WorkoutStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELED';

export type SegmentType = 'WARMUP' | 'RUN' | 'REST' | 'COOLDOWN';

export type TargetType = 'TIME' | 'DISTANCE';
```

Entidades esperadas:

- `Workout`
- `WorkoutSegment`
- `WorkoutPoint`
- `IntervalTemplate`
- `ActiveWorkoutState`
- `LocationPoint`

---

## 10. Telas do MVP

### Home

Entrada principal do app.

Critérios:

- abrir corrida livre;
- abrir treinos intervalados;
- mostrar último treino, se existir;
- funcionar sem treinos salvos.

### Corrida livre

Critérios:

- solicitar permissão de localização;
- capturar GPS;
- exibir tempo, distância, pace atual e pace médio;
- pausar;
- retomar;
- finalizar;
- cancelar;
- salvar treino concluído;
- ignorar pontos imprecisos.

### Criar treino intervalado

Campos:

- nome;
- tempo de aquecimento;
- tipo do tiro;
- valor do tiro;
- quantidade de tiros;
- tipo do intervalo;
- valor do intervalo;
- tempo de desaquecimento.

Critérios:

- validar com Zod;
- salvar template localmente;
- listar template salvo;
- permitir iniciar treino a partir do template.

### Execução de treino intervalado

Critérios:

- iniciar a partir de um template;
- gerar segmentos;
- exibir etapa atual;
- exibir repetição atual;
- exibir progresso;
- alternar segmentos automaticamente;
- emitir vibração/alerta na troca;
- salvar pontos associados ao segmento atual;
- finalizar automaticamente ao terminar.

### Histórico

Critérios:

- listar treinos concluídos;
- ordenar mais recentes primeiro;
- abrir detalhes;
- excluir treino.

### Detalhes do treino

Critérios:

- carregar treino por ID;
- carregar pontos;
- carregar segmentos;
- exibir resumo;
- funcionar para corrida livre e intervalado.

---

## 11. Regras de cálculo

Distância:

- calcular com Haversine;
- unidade em metros.

Duração:

- calcular em segundos.

Pace:

```txt
pace = duração em segundos / distância em km
```

Pace atual:

- usar janela móvel de 10 a 20 segundos;
- nunca usar apenas o último ponto.

GPS:

- ignorar pontos com `accuracy > 30`;
- descartar pontos inválidos;
- evitar `Infinity` ou `NaN`.

---

## 12. Motor intervalado

Arquivo esperado:

```txt
src/features/interval-training/interval-engine.ts
```

Responsabilidades:

- receber template;
- gerar segmentos;
- identificar segmento atual;
- calcular progresso;
- avançar segmento;
- pausar;
- retomar;
- cancelar;
- finalizar automaticamente.

O motor não deve acessar:

- React;
- SQLite;
- Zustand;
- Expo APIs;
- navegação.

---

## 13. Backlog do MVP

### Fase 1 — Bootstrap

- Criar projeto Expo com TypeScript.
- Configurar Expo Router.
- Configurar NativeWind.
- Criar estrutura de pastas.
- Criar componentes base.
- Criar telas vazias.

### Fase 2 — Banco local

- Configurar SQLite.
- Criar migrations.
- Criar repositories tipados.

### Fase 3 — Cálculos

- Implementar Haversine.
- Implementar cálculo de pace.
- Implementar formatadores.
- Criar testes.

### Fase 4 — Corrida livre

- Permissão GPS.
- Captura GPS.
- Métricas.
- Pausar/retomar/finalizar.
- Persistência local.

### Fase 5 — Histórico

- Listagem.
- Detalhe.
- Exclusão.

### Fase 6 — Templates intervalados

- Formulário.
- Validação.
- Persistência.
- Listagem.

### Fase 7 — Motor intervalado

- Geração de segmentos.
- Controle de progresso.
- Avanço automático.
- Testes.

### Fase 8 — Execução guiada

- Tela ativa.
- GPS.
- Segmentos.
- Feedback.
- Persistência.

### Fase 9 — Polimento

- Mapa.
- Tema escuro.
- Melhorias visuais.
- Background location.
- Teste em dispositivo físico.

---

## 14. Riscos técnicos

- GPS em background.
- Precisão do GPS.
- Consumo de bateria.
- Perda de treino ativo.
- Complexidade do motor intervalado.

---

## 15. Definition of Done do MVP

O MVP estará pronto quando:

- o app funcionar sem internet;
- não houver login;
- a corrida livre funcionar;
- o histórico funcionar;
- templates intervalados funcionarem;
- o treino intervalado guiado funcionar;
- dados forem persistidos localmente;
- detalhes do treino forem exibidos;
- houver testes para cálculos e motor;
- o app for validado em dispositivo físico.
