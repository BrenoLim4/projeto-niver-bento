# ROADMAP — Fazendinha do Bento (v2 — Revisão Final)

> Esta versão substitui a v1. Incorpora as decisões finais de revisão (jogo da memória sem QR,
> premiação livre, fluxo de duas etapas Revelação/Entrega, pescaria com dois tipos de QR,
> regras de sorteio e elegibilidade, TV única, sons, entregas pendentes, snapshot histórico e
> novo ciclo de vida dos eventos). Nenhuma decisão da v1 que conflite com este documento é válida.

---

## 0. Resumo das Alterações desta Revisão

Em relação à v1, o impacto é estrutural em três pontos: **modelagem de `eventos`**,
**modelagem de `premios`/sorteio** e **fases de desenvolvimento** (reordenadas e algumas
divididas/renomeadas). Abaixo o resumo; o detalhe está nas seções seguintes.

### Modelagem
- `eventos.status` passa de `pending|processing|completed` para
  **`pending|processing|revealed|delivered|completed`**.
- `eventos` ganha **snapshot histórico**: `premio_codigo`, `premio_nome`, `premio_imagem_url`,
  `premio_categoria` (copiados do prêmio no momento da criação do evento).
- `eventos` ganha timestamps por etapa: `revealed_at`, `delivered_at`, `completed_at`.
- `eventos.foto_url` deixa de ser preenchido na criação — só existe a partir da Etapa 2 (Entrega).
- `eventos.tipo` passa a ser `pescaria | memoria | roleta | corrida | livre` (remove `manual`,
  adiciona `livre`; `memoria` não depende mais de QR).
- **Novo**: `premios.status` ganha um terceiro valor — `disponivel | reservado | entregue`.
  O sorteio só considera `disponivel`; ao criar o evento (Etapa 1) o prêmio sorteado/escolhido
  vira `reservado` (impede sorteio duplicado enquanto o evento ainda não foi entregue); a
  Entrega (Etapa 2) muda para `entregue`. Sem isso, dois sorteios rápidos poderiam repetir o
  mesmo prêmio antes da entrega física acontecer.
- **Novo**: `premios.elegivel_para` (jsonb, array de tipos de brincadeira). Vazio/`null` =
  universal (elegível em qualquer sorteio). Caso contrário, restringe o sorteio àquela(s)
  brincadeira(s).
- **Novo**: `premios.bloqueado` (boolean, default `false`) — exclui o prêmio de qualquer
  sorteio sem alterar seu `status` (operador pode "pausar" um prêmio).
- `qr_codes`: campo `tipo` (pescaria/memória) é removido — só a Pescaria usa QR agora. Adiciona
  `tipo_qr enum ('fixo','aleatorio')`. Para `tipo_qr='fixo'`, `premio_id` é obrigatório. Para
  `'aleatorio'`, `premio_id` é `null` (o sorteio decide na hora do scan).
- `config.tela_atual_tv` renomeado para `config.modo_apresentacao`, com valores
  `hall_da_fama | corrida_animais | roleta_fazenda | estatisticas` (nomes alinhados ao pedido).
- Nova view `vw_entregas_pendentes` (eventos com `status='revealed'`).
- `vw_hall_da_fama` agora filtra `status IN ('delivered','completed')` (nunca
  `pending/processing/revealed`).

### Fluxos
- Toda premiação agora segue **2 etapas**: **Revelação** (sorteio/identificação → evento →
  TV → animação → revelação, termina em `status='revealed'`) e **Entrega** (foto + confirmação,
  termina em `status='delivered'`/`completed'`).
- A Pescaria Tipo 1 (prêmio fixo) ainda assim passa pelas 2 etapas — só não passa por sorteio.
- Jogo da Memória deixa de usar QR: o operador digita o nome do vencedor numa tela do
  Dashboard, o sistema sorteia o prêmio elegível e segue o fluxo normal.
- Nova tela oficial **"Premiação Livre"**: mesmo fluxo do Jogo da Memória, mas sem vínculo a
  uma brincadeira específica (prêmios elegíveis a `livre` ou universais).
- **Tesouro da Fazenda**: nunca entra em sorteio (`is_tesouro=true` é sempre excluído do pool).
  Só pode ser concedido por uma ação explícita do operador ("Liberar Tesouro da Fazenda"),
  que cria o evento diretamente com esse prêmio.
- Novo módulo **"Entregas Pendentes"**: lista eventos `revealed`, com ação "Registrar Entrega"
  (foto + confirmação) que move para `delivered`/`completed`.

### TV
- Confirma-se a hipótese da v1 (item 1 das ambiguidades): **rota única `/tv`**, sem páginas
  separadas para Roleta/Corrida. A TV é uma máquina de estados interna com os modos
  `hall_da_fama | corrida_animais | roleta_fazenda | estatisticas` (Estado Normal) + overlay de
  evento (Estado Evento), trocados via `config.modo_apresentacao` + Realtime. As páginas
  `jogos/roleta` e `jogos/corrida` da v1 são **removidas**; o que existe no lugar são telas de
  *disparo* no Dashboard (o sorteio/resultado é calculado lá e enviado como `metadata` do
  evento — a TV apenas anima o resultado já definido).

### Sons (novo, obrigatório)
- 4 efeitos: suspense, abertura do baú, vitória, tesouro. Estrutura de arquivos isolada
  (`assets/audio/`) e módulo `js/sons.js`, facilmente substituível.

### Fases
- Fases renumeradas/reorganizadas (17 fases, 0–16). Principais mudanças:
  - Fase "Ganhadores" da v1 dá lugar a **Entregas Pendentes** (Fase 7) — etapa de entrega
    isolada do CRUD de prêmios.
  - Novas fases dedicadas: **Premiação Livre** (Fase 11), **Jogo da Memória sem QR** (Fase 10).
  - **Roleta** e **Corrida** passam a ser implementadas como modos da TV + tela de disparo no
    Dashboard (Fases 12 e 13), não mais como páginas próprias completas.
  - Sons integrados na Fase 5 (animação) e na estrutura da Fase 1.

---

## 1. Regras de Negócio (versão final)

### 1.1 Fluxo Oficial de Premiação (2 Etapas)

**Etapa 1 — Revelação** (`status: pending → processing → revealed`)
1. Identificar o ganhador (nome digitado ou QR).
2. Determinar o prêmio: sorteio automático (memória, livre, pescaria tipo 2, roleta, corrida)
   ou vínculo fixo (pescaria tipo 1) ou seleção explícita (Tesouro).
3. Criar `eventos` com snapshot do prêmio, `status='pending'`. Marcar `premios.status='reservado'`.
4. TV detecta via Realtime, marca `processing`, executa animação (suspense → baú → revelação).
5. Ao final da revelação, TV marca `status='revealed', revealed_at=now()` e volta ao Estado Normal.

Nesta etapa **o prêmio ainda não foi entregue** e **nenhuma foto é exigida**.

**Etapa 2 — Entrega** (`status: revealed → delivered → completed`)
1. Operador abre "Entregas Pendentes", localiza o evento `revealed`.
2. Entrega o prêmio fisicamente.
3. Tira/envia foto do ganhador com o prêmio e o Bento.
4. Confirma: `eventos.status='delivered', delivered_at=now()`, `premios.status='entregue'`.
   Se o upload da foto for bem-sucedido no mesmo passo, já marca `status='completed',
   completed_at=now(), foto_url=...`. Se a foto falhar (rede), o evento fica `delivered`
   (sem foto) e o Hall da Fama exibe um placeholder até o reenvio, que então completa para
   `completed`.
5. Hall da Fama é atualizado via Realtime (mostra `delivered` e `completed`).

### 1.2 Pescaria (QR Code)

Dois tipos de QR, diferenciados por `qr_codes.tipo_qr`:

**Tipo 1 — Prêmio Fixo** (`tipo_qr='fixo'`, `premio_id` definido, ex. `QR-001 → Caneca Fazendinha`)
1. Escanear → validar `usado=false`.
2. Recuperar `premio_id` vinculado, copiar snapshot.
3. Criar evento (`tipo='pescaria'`, `status='pending'`), `premios.status='reservado'`,
   `qr_codes.usado=true`, `qr_codes.evento_id=evento.id`.
4. Segue fluxo normal (Etapas 1 e 2). **Sem sorteio.**

**Tipo 2 — Prêmio Aleatório** (`tipo_qr='aleatorio'`, `premio_id=null`, código físico ex.
`PREMIO_ALEATORIO` — pode haver vários QRs distintos com esse mesmo comportamento)
1. Escanear → validar `usado=false`.
2. Operador informa o nome do ganhador.
3. Sorteio entre prêmios elegíveis (`elegivel_para` contém `pescaria` ou é universal,
   `status='disponivel'`, `bloqueado=false`, `is_tesouro=false`).
4. Criar evento (`tipo='pescaria'`, `status='pending'`) com snapshot do prêmio sorteado,
   `premios.status='reservado'`, `qr_codes.usado=true`, `qr_codes.evento_id=evento.id`.
5. Segue fluxo normal (Etapas 1 e 2).

### 1.3 Jogo da Memória (físico, sem QR)

1. Operador abre "Jogo da Memória" no Dashboard e digita o nome do vencedor.
2. Sistema sorteia prêmio elegível (`elegivel_para` contém `memoria` ou universal,
   demais filtros como acima).
3. Cria evento (`tipo='memoria'`, `status='pending'`), `premios.status='reservado'`.
4. Segue fluxo normal (Etapas 1 e 2). O operador **não escolhe o prêmio**.

### 1.4 Premiação Livre

Tela oficial "Premiação Livre" no Dashboard, para premiações fora do contexto de uma
brincadeira específica:

1. Operador digita o nome do ganhador.
2. Sistema sorteia prêmio elegível (`elegivel_para` contém `livre` ou universal, demais
   filtros como acima).
3. Cria evento (`tipo='livre'`, `status='pending'`), `premios.status='reservado'`.
4. Segue fluxo normal (Etapas 1 e 2).

### 1.5 Roleta da Fazenda / Corrida dos Animais

Telas de **disparo** no Dashboard (não são mais páginas de apresentação completas — a
apresentação ocorre na TV):

1. Operador abre "Roleta" ou "Corrida" no Dashboard e toca em "Girar"/"Iniciar".
2. O resultado é calculado ali: sorteio de prêmio elegível (`elegivel_para` contém
   `roleta`/`corrida` ou universal) + dados de apresentação (ângulo final da roleta, animal
   vencedor da corrida) salvos em `eventos.metadata`.
3. Cria evento (`tipo='roleta'|'corrida'`, `status='pending'`) com snapshot do prêmio,
   `premios.status='reservado'`.
4. TV (modo `roleta_fazenda`/`corrida_animais`) recebe o evento, interrompe o loop ambiente,
   executa a animação de giro/corrida **usando os dados de `metadata`** (resultado
   determinístico, igual ao que o operador viu), depois segue para revelação normal.
5. Segue fluxo normal (Etapas 1 e 2).

Quando não há evento em processamento, os modos `roleta_fazenda`/`corrida_animais` da TV
exibem um **loop decorativo/ambiente** (sem prêmio real), conforme `config.modo_apresentacao`.

### 1.6 Regras de Sorteio e Elegibilidade

Pool de sorteio = prêmios que atendem **todas** as condições:
- `status = 'disponivel'`
- `bloqueado = false`
- `is_tesouro = false`
- `elegivel_para` é vazio/null (universal) **ou** contém o tipo da brincadeira atual

Ao sortear, o prêmio escolhido vira `status='reservado'` imediatamente (parte da mesma
transação de criação do evento), garantindo que nunca seja sorteado novamente antes de ser
entregue. Se o pool estiver vazio, a UI deve informar claramente ("nenhum prêmio elegível
disponível") — não há fallback automático para outra categoria.

### 1.7 Tesouro da Fazenda

- Existe exatamente 1 registro com `is_tesouro=true`.
- **Nunca** entra em sorteios (excluído do pool por definição, independente de `elegivel_para`).
- Concedido apenas via ação explícita "Liberar Tesouro da Fazenda" (Dashboard → Controle da TV
  ou card dedicado), que pede o nome do ganhador e cria o evento diretamente com
  `premio_id = tesouro`, `tipo='livre'`, seguindo o fluxo normal de 2 etapas.
- Animação exclusiva na Etapa 1 (mais brilho/partículas/duração, som próprio).
- Ao completar a Etapa 2 desse evento, `config.tesouro_status='encontrado'`.
- Hall da Fama exibe destaque permanente baseado em `config.tesouro_status` +
  o evento `completed` cujo `premio_categoria` indica o Tesouro (via flag no snapshot ou
  busca pelo evento com `metadata->>'is_tesouro' = 'true'`, copiado do prêmio no momento da
  criação).

### 1.8 Entregas Pendentes

Módulo administrativo novo (Dashboard):
- Lista `vw_entregas_pendentes` (eventos `status='revealed'`, ordenados por `revealed_at`):
  nome do ganhador + nome/imagem do prêmio (do snapshot).
- Ação "Registrar Entrega" por item → captura/envia foto → confirma (ver 1.1, Etapa 2).
- Atualiza Hall da Fama e Estatísticas via Realtime.

### 1.9 Sons (obrigatório)

4 efeitos, cada um um arquivo substituível em `assets/audio/`:
- `suspense.mp3` — Etapa 1 (tela "Bento encontrou um presente para você!")
- `bau.mp3` — animação do baú (tremer/brilhar/partículas)
- `vitoria.mp3` — revelação do prêmio
- `tesouro.mp3` — animação exclusiva do Tesouro (substitui `vitoria.mp3` nesse caso)

Módulo `js/sons.js` expõe `tocar('suspense'|'bau'|'vitoria'|'tesouro')`, com pré-carregamento
e tratamento de autoplay bloqueado (a TV precisa de uma interação inicial — ex. botão
"Iniciar TV" no boot — para liberar áudio no navegador).

---

## 2. Arquitetura (confirmação)

A arquitetura orientada a eventos da v1 é confirmada e reforçada:

`brincadeira → sorteio/identificação → evento (pending) → TV (processing) → revelação
(revealed) → entrega + foto (delivered/completed) → Hall da Fama`

- **Dois tipos de tela** (Dashboard mobile / TV fullscreen única) + Supabase Realtime como
  cola — mantido.
- **Estado global da TV** via `config` (agora `modo_apresentacao`) — mantido, renomeado.
- **Fila persistida** em `eventos.status` — mantido, com o novo estado `revealed` marcando
  "saiu da fila da TV, está na fila de entregas".
- Stack 100% vanilla (HTML/CSS/JS) + Supabase — mantido.

---

## 3. Modelagem do Supabase (revisão final)

### Tabela `premios`
| Campo | Tipo | Observação |
|---|---|---|
| id | uuid (PK) | |
| codigo | text (unique) | ex. `P-014` |
| nome | text | |
| descricao | text | |
| imagem_url | text | bucket `premios` |
| categoria | enum (`comum`, `raro`, `lendario`) | |
| status | enum (`disponivel`, `reservado`, `entregue`) | **novo valor `reservado`** |
| elegivel_para | jsonb (array de text, default `[]`) | **novo** — vazio = universal; valores possíveis: `pescaria`, `memoria`, `roleta`, `corrida`, `livre` |
| bloqueado | boolean (default false) | **novo** — exclui do sorteio sem mudar status |
| is_tesouro | boolean (default false) | apenas 1 registro `true`; sempre excluído do sorteio |
| created_at | timestamptz | |

### Tabela `eventos`
| Campo | Tipo | Observação |
|---|---|---|
| id | uuid (PK) | |
| tipo | enum (`pescaria`, `memoria`, `roleta`, `corrida`, `livre`) | **`manual` removido, `livre` adicionado** |
| premio_id | uuid (FK premios) | |
| premio_codigo | text | **novo — snapshot** |
| premio_nome | text | **novo — snapshot** |
| premio_imagem_url | text | **novo — snapshot** |
| premio_categoria | enum (`comum`,`raro`,`lendario`) | **novo — snapshot** |
| vencedor | text | nome do convidado |
| status | enum (`pending`,`processing`,`revealed`,`delivered`,`completed`) | **novo ciclo de vida** |
| foto_url | text (nullable) | preenchido na Etapa 2 |
| metadata | jsonb (nullable) | resultado de roleta/corrida, flags do tesouro, código do QR usado, etc. |
| created_at | timestamptz | |
| revealed_at | timestamptz (nullable) | **novo** |
| delivered_at | timestamptz (nullable) | **novo** |
| completed_at | timestamptz (nullable) | |

### Tabela `qr_codes`
| Campo | Tipo | Observação |
|---|---|---|
| id | uuid (PK) | |
| codigo | text (unique) | valor lido do QR físico |
| tipo_qr | enum (`fixo`, `aleatorio`) | **novo, substitui `tipo`** |
| premio_id | uuid (FK premios, nullable) | obrigatório se `tipo_qr='fixo'`; `null` se `'aleatorio'` |
| usado | boolean (default false) | |
| evento_id | uuid (FK eventos, nullable) | preenchido quando usado |
| created_at | timestamptz | |

> Jogo da Memória não usa mais `qr_codes` — campo `tipo` (pescaria/memória) da v1 é removido
> pois só a Pescaria usa QR.

### Tabela `config` (linha única)
| Campo | Tipo | Observação |
|---|---|---|
| id | int (PK, sempre 1) | |
| modo_apresentacao | enum (`hall_da_fama`,`corrida_animais`,`roleta_fazenda`,`estatisticas`) | **renomeado de `tela_atual_tv`**, default `hall_da_fama`; só muda via evento de premiação ou controle remoto (sem rotação automática) |
| tesouro_status | enum (`nao_encontrado`, `encontrado`) | |
| pin_dashboard | text | trava de UI (não é segurança) |
| festa_ativa | boolean | |

### Views
- **`vw_hall_da_fama`**: `eventos` (`status IN ('delivered','completed')`) ordenado por
  `coalesce(completed_at, delivered_at) desc`. Usa os campos de snapshot
  (`premio_nome`, `premio_imagem_url`, `premio_categoria`, `premio_codigo`) — não depende de
  join com `premios` para exibição (preserva histórico mesmo se o prêmio for editado/excluído).
- **`vw_entregas_pendentes`** (**novo**): `eventos` (`status='revealed'`) ordenado por
  `revealed_at asc`, com campos de snapshot + `vencedor`.
- **`vw_estatisticas`**: total de eventos, total `delivered+completed` (entregues), total
  `pending+processing` (em andamento), total `revealed` (aguardando entrega), contagem por
  `premio_categoria` entre os entregues.

### Storage (buckets)
- **`premios`**: imagens dos prêmios (preparação, leitura pública).
- **`fotos`**: fotos dos ganhadores, nome de arquivo = `{evento_id}.jpg` (leitura pública,
  upload via dashboard).

### RLS
- Habilitado em todas as tabelas, policies permissivas para `anon` (leitura e escrita),
  decisão documentada como comentário no `schema.sql` (evento privado, baixo risco, PIN de UI
  como única trava — não é segurança real).

---

## 4. Estrutura de Pastas (revisão)

```
/
├── CLAUDE.md
├── ROADMAP.md
├── index.html                  # landing simples (links Dashboard/TV)
│
├── dashboard/
│   ├── index.html              # home com cards
│   ├── premios.html            # CRUD de prêmios (status, elegivel_para, bloqueado, tesouro)
│   ├── premiacao-livre.html    # Premiação Livre (nome + sorteio)
│   ├── jogo-memoria.html       # Jogo da Memória (nome + sorteio, sem QR)
│   ├── pescaria.html           # scanner QR (fixo + aleatório)
│   ├── roleta.html             # disparo da Roleta (sorteio + envia evento p/ TV)
│   ├── corrida.html            # disparo da Corrida (sorteio + envia evento p/ TV)
│   ├── entregas-pendentes.html # Etapa 2: registrar entrega + foto
│   ├── estatisticas.html
│   └── controle-tv.html        # modo_apresentacao, status tesouro, liberar Tesouro
│
├── tv/
│   └── index.html              # ÚNICA rota pública: estado normal + estado evento
│
├── assets/
│   ├── css/
│   │   ├── variables.css       # paleta oficial
│   │   ├── base.css
│   │   ├── components.css
│   │   ├── animacoes.css        # baú, partículas, revelação, tesouro
│   │   ├── tv.css
│   │   └── dashboard.css
│   ├── img/                     # mascote Bento, ícones, fundos
│   └── audio/                   # suspense.mp3, bau.mp3, vitoria.mp3, tesouro.mp3
│
├── js/
│   ├── supabaseClient.js
│   ├── realtime.js              # subscrições centralizadas
│   ├── fila-eventos.js          # lógica da fila da TV (seção 7)
│   ├── animacoes.js              # sequência suspense→baú→revelação→encerramento
│   ├── sons.js                   # módulo de áudio
│   ├── sorteio.js                # regras de sorteio/elegibilidade (seção 1.6)
│   ├── premios.js
│   ├── entregas.js                # Etapa 2 (entregas-pendentes.html)
│   ├── halldafama.js
│   ├── estatisticas.js
│   ├── config-tv.js
│   ├── qrscanner.js
│   ├── roleta.js
│   ├── corrida.js
│   └── vendor/jsQR.js            # única dependência externa vendorizada
│
└── supabase/
    ├── schema.sql                # criado na Fase 2
    └── seed.sql                  # criado na Fase 2
```

> `jogos/roleta` e `jogos/corrida` da v1 foram removidos (mergeados na TV + telas de disparo
> no dashboard). `jogos/pescaria` e o conceito de "jogo da memória com QR" são substituídos
> pelas páginas do dashboard acima.

---

## 5. Fluxos de Navegação (revisão)

### Dashboard (mobile-first)
```
[PIN] → Home (cards)
          ├─ Premiação Livre        (Etapa 1: nome → sorteio → evento)
          ├─ Jogo da Memória        (Etapa 1: nome → sorteio → evento)
          ├─ Pescaria                (scanner QR fixo/aleatório → evento)
          ├─ Roleta da Fazenda       (disparo: sorteio + giro → evento)
          ├─ Corrida dos Animais     (disparo: sorteio + corrida → evento)
          ├─ Entregas Pendentes      (Etapa 2: foto + confirmar entrega)
          ├─ Hall da Fama            (visualização)
          ├─ Estatísticas
          ├─ Gerenciar Prêmios       (CRUD + elegibilidade + bloqueio + tesouro)
          └─ Controle da TV          (modo_apresentacao, status tesouro, liberar tesouro)
```

### TV (fullscreen, rota única `/tv`)
```
Boot → desbloquear áudio (1 toque) → conecta Realtime → carrega config + fila pendente
   │
   ├─ Fila vazia → Estado Normal
   │     └─ modo = config.modo_apresentacao:
   │          hall_da_fama (default) | corrida_animais (ambiente) |
   │          roleta_fazenda (ambiente) | estatisticas
   │
   └─ Fila com item → Estado Evento
         └─ Suspense → Baú → (Roleta/Corrida anima resultado de metadata, se aplicável)
            → Revelação → status='revealed' → Encerramento → volta ao Estado Normal
```

### Pescaria (scanner, celular do operador/ajudante)
```
dashboard/pescaria.html
   → Câmera ativa → escaneia QR (ou digita código manualmente)
   → valida qr_codes.usado=false
   → tipo_qr='fixo'  → recupera premio_id vinculado
     tipo_qr='aleatorio' → pede nome → sorteia premio elegível
   → cria evento (pending) + snapshot, premios.status='reservado', qr_codes.usado=true
   → feedback "Enviado para a TV!"
```

### Jogo da Memória / Premiação Livre (dashboard, sem QR)
```
dashboard/jogo-memoria.html | dashboard/premiacao-livre.html
   → digita nome do ganhador
   → sorteia prêmio elegível (memoria | livre | universal)
   → cria evento (pending) + snapshot, premios.status='reservado'
   → feedback "Enviado para a TV!"
```

### Roleta / Corrida (dashboard, disparo)
```
dashboard/roleta.html | dashboard/corrida.html
   → toca "Girar"/"Iniciar"
   → sorteia prêmio elegível + calcula resultado de apresentação (ângulo/animal)
   → cria evento (pending) com metadata + snapshot, premios.status='reservado'
   → feedback "Enviado para a TV!" (operador pode ver preview local opcional)
```

### Entregas Pendentes
```
dashboard/entregas-pendentes.html
   → lista vw_entregas_pendentes (status='revealed')
   → seleciona item → tira/envia foto → confirma
   → eventos.status='delivered'(+foto)='completed', premios.status='entregue'
   → se premio.is_tesouro → config.tesouro_status='encontrado'
   → Hall da Fama atualiza via Realtime
```

---

## 6. Fluxos Realtime (revisão)

Sem polling — `postgres_changes` do Supabase Realtime, 2 canais (alto tráfego `eventos`;
baixo tráfego `premios`+`config`).

| Canal/Tabela ouvida | Quem ouve | Reação |
|---|---|---|
| `eventos` (INSERT, status=pending) | TV | adiciona à fila local |
| `eventos` (UPDATE → processing) | Dashboard (Entregas Pendentes, Controle TV) | reflete "TV está animando" |
| `eventos` (UPDATE → revealed) | Dashboard (Entregas Pendentes) | novo item na lista de entregas pendentes |
| `eventos` (UPDATE → delivered/completed) | TV (Hall da Fama), Dashboard (Hall da Fama, Estatísticas, Entregas Pendentes) | novo card no Hall da Fama; remove de entregas pendentes; recalcula estatísticas |
| `premios` (UPDATE status/elegivel_para/bloqueado) | Dashboard (Prêmios, telas de sorteio) | atualiza disponibilidade/pool |
| `config` (UPDATE) | TV | troca `modo_apresentacao` (controle remoto), atualiza `tesouro_status` |

Reconexão: callbacks `SUBSCRIBED`/`CLOSED`/`CHANNEL_ERROR` do client Supabase; ao reconectar,
re-sincronizar buscando `eventos` com `status IN ('pending','processing')` e estado atual de
`config`.

---

## 7. Fila de Eventos da TV (revisão)

**Fonte de verdade**: `eventos.status`.

1. **Boot da TV**:
   - Busca `eventos` com `status IN ('pending','processing')`, ordenado por `created_at`.
   - Qualquer um em `processing` é resetado para `pending` (TV recarregada no meio de uma
     animação).
   - Monta a fila local com esse resultado.

2. **Novo evento via Realtime** (`INSERT status='pending'`) → entra no fim da fila local.

3. **Loop de processamento**:
   - Se `fila.length > 0` **e** TV está em Estado Normal:
     - Remove o primeiro item; `UPDATE eventos SET status='processing'`.
     - Salva o modo atual (`config.modo_apresentacao`) para retornar depois.
     - Executa a sequência de animação (Fase 5), usando `metadata` para roleta/corrida e o
       flag de tesouro para a animação exclusiva.
     - Ao final da revelação: `UPDATE eventos SET status='revealed', revealed_at=now()`.
     - Encerramento → volta ao modo salvo (Estado Normal).
   - Eventos `revealed` **não retornam** à fila da TV — passam a aparecer em "Entregas
     Pendentes" (responsabilidade do Dashboard, fora do loop da TV).
   - Fila vazia → permanece no modo atual do Estado Normal; o modo só muda por evento de
     premiação ou por `config.modo_apresentacao` via controle remoto (sem rotação automática).

4. **Garantias**: nunca interrompe animação em curso; ordem estrita por `created_at`;
   resiliente a reload/queda de conexão (passo 1).

5. Durações configuráveis em `js/animacoes.js` (suspense, baú, revelação, encerramento) —
   ajustáveis sem tocar na lógica de fila.

---

## 8. Riscos Técnicos (atualizado)

| Risco | Impacto | Mitigação |
|---|---|---|
| Wi-Fi instável | TV perde eventos/Realtime cai | Fila persistida em `eventos.status`; reconexão refaz query de `pending`/`processing` |
| TV recarregada em `processing` | Evento "trava" | Boot reseta `processing→pending` |
| Sorteio duplicado (2 eventos quase simultâneos) | Mesmo prêmio sorteado 2x | `premios.status='reservado'` no momento do sorteio remove o prêmio do pool imediatamente |
| Pool de sorteio vazio para uma brincadeira | Sorteio falha | UI informa claramente; operador pode cadastrar/desbloquear prêmios antes de continuar |
| Upload de foto falha (Etapa 2) | Evento fica sem foto | `status='delivered'` sem foto é aceitável; reenvio posterior completa para `completed`; Hall da Fama usa placeholder |
| `anon key` pública com escrita liberada | Alteração indevida | Risco aceito (evento privado); RLS permissivo documentado |
| Tesouro entregue 2x | Quebra narrativa | `is_tesouro` sempre fora do pool; ação de liberação é manual e única; `config.tesouro_status` vira `encontrado` após `completed` |
| Câmera p/ QR em ambiente externo | Scanner falha | Entrada manual do código como fallback |
| TV ligada 6h+ | Memory leak | CSS animations/transitions; limpar listeners ao trocar de tela |
| Áudio bloqueado por autoplay | Sons não tocam | Tela de boot da TV exige 1 toque para desbloquear `AudioContext` |
| Operador aperta botão 2x | Evento duplicado | Desabilitar botão até confirmação do insert |

---

## 9. Sugestões de Simplificação (mantidas)

- Sem framework/bundler/npm: Supabase JS via CDN, HTML estático.
- PIN simples em `config.pin_dashboard`, validado em JS.
- `eventos` continua sendo a única fonte para fila, Hall da Fama, Estatísticas e Entregas
  Pendentes.
- CSS com variáveis nativas (`:root { --dourado: #F2A64A; ... }`).
- Única dependência externa: `jsQR` (vendorizada), só para a Pescaria.
- Geração de QR Codes para impressão: ferramenta externa apenas na fase de preparação.

---

## Fases de Desenvolvimento (revisão final — 0 a 16)

### FASE 0 — Arquitetura e Fundação
- **Objetivo**: esqueleto técnico do projeto.
- **Escopo**: estrutura de pastas (seção 4); `js/supabaseClient.js`; `assets/css/variables.css`
  com a paleta oficial; página de teste de conexão; decisão de hosting (estático).
- **Critérios de aceite**: projeto abre em servidor estático; página de teste confirma conexão
  com Supabase; paleta renderiza corretamente.
- **Dependências**: nenhuma.
- **Entregáveis**: estrutura de pastas, `supabaseClient.js`, `variables.css`,
  `_teste-conexao.html`.

### FASE 1 — Identidade Visual e Assets
- **Objetivo**: design system + assets (incluindo áudio).
- **Escopo**: `base.css`, `components.css` (botões, cards, modais, badges de categoria);
  assets do Bento (header/splash); ícones temáticos; layout mobile-first (dashboard) e 16:9
  fullscreen (TV); pasta `assets/audio/` com 4 placeholders (`suspense.mp3`, `bau.mp3`,
  `vitoria.mp3`, `tesouro.mp3`).
- **Critérios de aceite**: componentes renderizam em celular e TV; Bento presente em ambos;
  paleta consistente; 4 arquivos de áudio carregam sem erro (mesmo que provisórios).
- **Dependências**: FASE 0.
- **Entregáveis**: `base.css`, `components.css`, assets de imagem/áudio.

### FASE 2 — Supabase e Banco de Dados
- **Objetivo**: provisionar o modelo de dados final (seção 3).
- **Escopo**: tabelas `premios` (com `elegivel_para`, `bloqueado`, status `reservado`),
  `eventos` (novo ciclo de vida + snapshot + timestamps), `qr_codes` (`tipo_qr`), `config`
  (`modo_apresentacao`); views `vw_hall_da_fama`, `vw_entregas_pendentes`, `vw_estatisticas`;
  RLS permissivo documentado; buckets `premios` e `fotos`; seed (prêmios comum/raro/lendário +
  1 tesouro com `elegivel_para` variados, linha única de `config`).
- **Critérios de aceite**: schema validado via SQL Editor; inserts/selects via `anon key`
  funcionam; views retornam dados corretos com o seed; transição de status manual via SQL
  reflete corretamente nas views.
- **Dependências**: FASE 0.
- **Entregáveis**: `supabase/schema.sql`, `supabase/seed.sql`.

### FASE 3 — Dashboard: Núcleo
- **Objetivo**: PIN, home e CRUD de prêmios.
- **Escopo**: `dashboard/index.html` (PIN + home com todos os cards da seção 5); `js/sorteio.js`
  (regras de elegibilidade/sorteio, seção 1.6, reutilizável); `dashboard/premios.html` (CRUD
  completo: categoria, status, `elegivel_para`, `bloqueado`, marcar Tesouro).
- **Critérios de aceite**: navegação por todos os cards via celular; CRUD de prêmios
  funcional incluindo elegibilidade/bloqueio; apenas 1 prêmio pode ser marcado `is_tesouro`.
- **Dependências**: FASE 1, FASE 2.
- **Entregáveis**: `dashboard/index.html`, `dashboard/premios.html`, `js/premios.js`,
  `js/sorteio.js`.

### FASE 4 — TV: Base (rota única + fila)
- **Objetivo**: fullscreen `/tv` com fila e os 4 modos de apresentação.
- **Escopo**: `tv/index.html`; `js/realtime.js`; `js/fila-eventos.js` (seção 7); tela de
  desbloqueio de áudio no boot; modos `hall_da_fama | corrida_animais | roleta_fazenda |
  estatisticas` (placeholders), exibindo o modo definido em `config.modo_apresentacao` (sem
  rotação automática — troca apenas via evento de premiação ou controle remoto); recuperação
  de estado no boot/reload.
- **Critérios de aceite**: TV abre em `hall_da_fama`; evento inserido manualmente (SQL Editor)
  é detectado, vira `processing` e depois `revealed` (mesmo sem animação completa); reload
  recupera fila pendente.
- **Dependências**: FASE 1, FASE 2.
- **Entregáveis**: `tv/index.html`, `js/realtime.js`, `js/fila-eventos.js`.

### FASE 5 — Sistema de Animação + Sons
- **Objetivo**: sequência completa de premiação com áudio.
- **Escopo**: Suspense → Baú (tremer/brilhar/partículas) → Revelação (nome/imagem/código do
  prêmio + nome do ganhador, marca `revealed`) → Encerramento; `animacoes.css`,
  `js/animacoes.js`, `js/sons.js` (suspense/bau/vitoria, troca para `tesouro.mp3` quando o
  snapshot indica Tesouro); durações configuráveis.
- **Critérios de aceite**: evento de teste executa as 4 etapas na ordem correta, com som
  correspondente em cada etapa, exibe dados corretos, marca `revealed` e retorna ao Estado
  Normal sem intervenção manual.
- **Dependências**: FASE 4, FASE 2.
- **Entregáveis**: `assets/css/animacoes.css`, `js/animacoes.js`, `js/sons.js`.

### FASE 6 — Hall da Fama
- **Objetivo**: tela padrão da TV com ganhadores e contadores.
- **Escopo**: renderização de `vw_hall_da_fama` (`delivered`+`completed`, usando campos de
  snapshot); contadores (total, raros, lendários); status do Tesouro
  (`config.tesouro_status`) com destaque permanente; atualização via Realtime.
- **Critérios de aceite**: novo `delivered`/`completed` aparece automaticamente; eventos
  `pending/processing/revealed` nunca aparecem; contadores corretos; destaque do Tesouro
  reflete `config.tesouro_status`.
- **Dependências**: FASE 2, FASE 4, FASE 5.
- **Entregáveis**: seção Hall da Fama em `tv/index.html`, `js/halldafama.js`.

### FASE 7 — Entregas Pendentes + Sistema de Fotos (Etapa 2)
- **Objetivo**: implementar a Etapa 2 completa.
- **Escopo**: `dashboard/entregas-pendentes.html` (lista `vw_entregas_pendentes`); captura
  (`capture="environment"`) ou upload de foto com compressão client-side (`<canvas>`,
  ~1280px, JPEG 0.8); ação "Registrar Entrega" → `js/entregas.js` executa a transição
  `revealed → delivered/completed`, `premios.status='entregue'`, e (se Tesouro)
  `config.tesouro_status='encontrado'`.
- **Critérios de aceite**: item sai de "Entregas Pendentes" e aparece no Hall da Fama em
  poucos segundos, sem reload da TV; falha de upload deixa o evento em `delivered` sem foto
  e permite reenvio.
- **Dependências**: FASE 2, FASE 6.
- **Entregáveis**: `dashboard/entregas-pendentes.html`, `js/entregas.js`.

### FASE 8 — Realtime: Consolidação e Resiliência
- **Objetivo**: validar e endurecer fluxos realtime sob condições reais.
- **Escopo**: revisão dos 2 canais; reconexão automática; testes de múltiplos eventos em
  sequência rápida; teste de queda/retomada de Wi-Fi; teste de reload da TV com fila não
  vazia e com itens `revealed` pendentes de entrega.
- **Critérios de aceite**: reconexão em até ~30s retoma a fila sem perder eventos; 5 eventos
  em sequência são processados 1 a 1 na ordem correta; Hall da Fama/Estatísticas/Entregas
  Pendentes refletem mudanças em <2s.
- **Dependências**: FASES 4–7.
- **Entregáveis**: `js/realtime.js` consolidado, checklist de testes de resiliência.

### FASE 9 — Pescaria (QR Tipo Fixo e Aleatório)
- **Objetivo**: scanner de Pescaria com os dois tipos de QR.
- **Escopo**: `dashboard/pescaria.html` com leitor `jsQR` + fallback manual; lookup em
  `qr_codes`; `tipo_qr='fixo'` → snapshot direto; `tipo_qr='aleatorio'` → pede nome + chama
  `js/sorteio.js`; cria `eventos` (`tipo='pescaria'`, `pending`), marca `premios.status=
  'reservado'` e `qr_codes.usado=true`.
- **Critérios de aceite**: QR fixo cria evento com o prêmio correto sem sorteio; QR aleatório
  pede nome, sorteia entre elegíveis e cria evento; QR já usado bloqueia com mensagem clara;
  entrada manual funciona.
- **Dependências**: FASE 2, FASE 3, FASE 5, `jsQR` vendorizado.
- **Entregáveis**: `dashboard/pescaria.html`, `js/qrscanner.js`, seed de `qr_codes`
  (fixo + aleatório).

### FASE 10 — Jogo da Memória (sem QR)
- **Objetivo**: tela de sorteio para o jogo da memória físico.
- **Escopo**: `dashboard/jogo-memoria.html` — nome do vencedor → `js/sorteio.js` (elegível
  `memoria`/universal) → cria `eventos` (`tipo='memoria'`, `pending`) + snapshot,
  `premios.status='reservado'`.
- **Critérios de aceite**: informar nome cria evento com prêmio sorteado corretamente
  (respeitando elegibilidade/bloqueio/reservas); operador não escolhe o prêmio em nenhum
  momento.
- **Dependências**: FASE 2, FASE 3, FASE 5.
- **Entregáveis**: `dashboard/jogo-memoria.html`.

### FASE 11 — Premiação Livre
- **Objetivo**: tela oficial de premiação livre.
- **Escopo**: `dashboard/premiacao-livre.html` — nome do vencedor → `js/sorteio.js` (elegível
  `livre`/universal) → cria `eventos` (`tipo='livre'`, `pending`) + snapshot,
  `premios.status='reservado'`. Inclui a ação "Liberar Tesouro da Fazenda" (seleção explícita
  do prêmio Tesouro, fora do sorteio), acessível também por aqui ou por `controle-tv.html`.
- **Critérios de aceite**: fluxo completo igual ao Jogo da Memória, mas com pool `livre`;
  liberar o Tesouro cria evento com o prêmio Tesouro e dispara a animação exclusiva (Fase 13).
- **Dependências**: FASE 2, FASE 3, FASE 5.
- **Entregáveis**: `dashboard/premiacao-livre.html`.

### FASE 12 — Roleta da Fazenda
- **Objetivo**: roleta como modo da TV + disparo no dashboard.
- **Escopo**: `dashboard/roleta.html` (sorteio elegível `roleta`/universal + cálculo do
  ângulo final, salvo em `eventos.metadata`); modo `roleta_fazenda` em `tv/index.html`:
  loop ambiente (sem prêmio) quando ocioso, animação de giro determinística (usa
  `metadata.angulo`) quando há evento `tipo='roleta'` em `processing`.
- **Critérios de aceite**: disparo no dashboard cria evento com prêmio sorteado e ângulo;
  TV gira de forma fluida até o ângulo definido e segue para revelação; modo ambiente roda em
  loop quando não há evento.
- **Dependências**: FASE 2, FASE 5, FASE 4.
- **Entregáveis**: `dashboard/roleta.html`, `js/roleta.js`, seção `roleta_fazenda` em
  `tv/index.html`.

### FASE 13 — Corrida dos Animais + Tesouro da Fazenda
- **Objetivo**: corrida como modo da TV + disparo no dashboard; animação exclusiva do
  Tesouro.
- **Escopo**: `dashboard/corrida.html` (sorteio elegível `corrida`/universal + animal
  vencedor em `eventos.metadata`); modo `corrida_animais` em `tv/index.html` (ambiente +
  corrida determinística); variação exclusiva da animação de revelação para o Tesouro
  (mais brilho/partículas/duração + `tesouro.mp3`), acionada quando o snapshot do evento
  indica `is_tesouro`; ao completar esse evento, `config.tesouro_status='encontrado'`.
- **Critérios de aceite**: corrida anima até vencedor visualmente claro e segue fluxo normal;
  evento do Tesouro (criado na Fase 11) dispara animação exclusiva e atualiza
  `tesouro_status` + destaque no Hall da Fama.
- **Dependências**: FASE 2, FASE 5, FASE 6, FASE 11.
- **Entregáveis**: `dashboard/corrida.html`, `js/corrida.js`, seção `corrida_animais` +
  variação Tesouro em `tv/index.html`/`animacoes.js`.

### FASE 14 — Estatísticas
- **Objetivo**: tela de estatísticas em tempo real, na TV e no dashboard.
- **Escopo**: renderização de `vw_estatisticas` (total, entregues, em andamento, aguardando
  entrega, por categoria) em `tv/index.html` (modo `estatisticas`) e
  `dashboard/estatisticas.html`; atualização via Realtime.
- **Critérios de aceite**: contadores corretos após bateria de eventos de teste cobrindo
  todos os status; ambas as telas atualizam sem reload.
- **Dependências**: FASE 2, FASE 8.
- **Entregáveis**: seção Estatísticas em `tv/index.html`, `dashboard/estatisticas.html`,
  `js/estatisticas.js`.

### FASE 15 — Controle da TV
- **Objetivo**: painel de controle remoto da TV.
- **Escopo**: `dashboard/controle-tv.html` — trocar `config.modo_apresentacao` manualmente
  (única forma de mudar a tela fora dos eventos de premiação, já que não há rotação
  automática), ver `tesouro_status`, atalho para "Liberar Tesouro da Fazenda".
- **Critérios de aceite**: troca de modo no dashboard reflete na TV em <2s via Realtime.
- **Dependências**: FASE 2, FASE 4.
- **Entregáveis**: `dashboard/controle-tv.html`, `js/config-tv.js`.

### FASE 16 — Testes Gerais e Polimento
- **Objetivo**: ensaio geral, ajustes finos e plano de contingência para o dia da festa.
- **Escopo**: simulação ponta a ponta de todas as brincadeiras (Pescaria fixo/aleatório,
  Memória, Livre, Roleta, Corrida, Tesouro) em sequência rápida (estresse da fila);
  validação completa do ciclo `pending → processing → revealed → delivered/completed`;
  checklist de contingência (TV travada, sem internet, scanner falhando, áudio bloqueado);
  ajustes de timing/responsividade/sons; revisão final da identidade visual.
- **Critérios de aceite**: roteiro completo da festa executado sem falhas perceptíveis;
  checklist de contingência validado; equipe operando 100% via celular.
- **Dependências**: todas as fases anteriores.
- **Entregáveis**: checklist de operação do dia da festa, lista de bugs conhecidos/aceitos,
  ajustes finais de CSS/JS.

---

## MVP da Festa (atualizado)

Conjunto mínimo, caso falte tempo:

1. **FASE 0** — Fundação.
2. **FASE 2 (reduzida)** — `premios`, `eventos` (com novo ciclo de vida e snapshot), `config`,
   `vw_hall_da_fama`, `vw_entregas_pendentes` (pode ficar sem `qr_codes`/`vw_estatisticas`).
3. **FASE 3 + 11** — Dashboard com PIN + "Premiação Livre" (sorteio simples) como caminho
   único de criação de evento (substitui Pescaria/Memória/Roleta/Corrida no MVP).
4. **FASE 4 + 5** — TV com fila + animação completa (com sons mínimos).
5. **FASE 6** — Hall da Fama com contadores e status do Tesouro.
6. **FASE 7** — Entregas Pendentes + foto (Etapa 2 é essencial — sem ela nada chega ao Hall
   da Fama no novo modelo).
7. **Tesouro** — 1 prêmio `is_tesouro=true`, liberado via "Premiação Livre" (ação explícita).

**Podem ficar de fora do MVP**:
- Pescaria com QR (Fase 9) e Jogo da Memória dedicado (Fase 10) — substituídos por
  "Premiação Livre" no MVP.
- Roleta e Corrida como modos da TV (Fases 12–13) — podem ser conduzidas "no braço" pelo
  organizador, prêmio registrado via Premiação Livre.
- Estatísticas dedicadas (Fase 14) — contadores essenciais já no Hall da Fama.
- Controle da TV dedicado (Fase 15) — modo pode ser fixado direto via SQL/`config` durante o
  MVP.
- Resiliência avançada (Fase 8) — manter o reset básico `processing→pending` no boot, que é
  barato e recomendado mesmo no MVP.

---

## Status

✅ Roadmap revisado e aprovado para início da implementação.

✅ **FASE 0 concluída** — estrutura de pastas, `assets/css/variables.css` (paleta oficial),
`js/supabaseClient.js` (credenciais reais configuradas) e `_teste-conexao.html`.

✅ **FASE 1 concluída** — `assets/css/base.css` (tipografia, tokens de espaçamento/raio/sombra,
layout mobile-first + `tela-tv` 16:9), `assets/css/components.css` (botões, cards, modais,
badges de categoria/status), 15 ícones temáticos SVG (`assets/img/icons/`), 4 placeholders de
áudio (`assets/audio/*.mp3`, silenciosos) e guia de estilo (`_estilo.html`). Stubs de
`dashboard/index.html`, `tv/index.html` e `index.html` atualizados com a nova identidade visual.

✅ `assets/img/bento-foto.jpg` adicionada — mascote já aparece em `_estilo.html`, `index.html`,
`dashboard/index.html` e `tv/index.html`.

✅ **FASE 2 (código pronto)** — `supabase/schema.sql` (enums, tabelas `premios`/`eventos`/
`qr_codes`/`config`, views `vw_hall_da_fama`/`vw_entregas_pendentes`/`vw_estatisticas`, RLS
permissivo para `anon`, buckets `premios`/`fotos`) e `supabase/seed.sql` (16 prêmios
comum/raro/lendário com `elegivel_para` variados + 1 Tesouro da Fazenda + linha única de
`config`).

✅ **FASE 2 validada** — `schema.sql` e `seed.sql` executados no SQL Editor; confirmado via
`anon key` que `premios` tem os 16 registros do seed, `config` tem a linha única e
`vw_estatisticas`/`vw_hall_da_fama`/`vw_entregas_pendentes` respondem corretamente.

✅ **FASE 3 concluída** — `dashboard/index.html` (tela de PIN validada contra
`config.pin_dashboard`, persistida em `sessionStorage`, + home com os 10 cards da seção 5);
`dashboard/premios.html` + `js/premios.js` (CRUD completo: categoria, status, `elegivel_para`,
`bloqueado`, marcação exclusiva de `is_tesouro`, atualização via Realtime); `js/sorteio.js`
(regras de elegibilidade/sorteio da seção 1.6, reutilizável nas próximas fases). Stubs criados
para as demais páginas do dashboard (`premiacao-livre`, `jogo-memoria`, `pescaria`, `roleta`,
`corrida`, `entregas-pendentes`, `estatisticas`, `controle-tv`), cada um indicando sua fase de
implementação.

✅ **FASE 4 concluída** — `tv/index.html` (rota única fullscreen: boot com desbloqueio de
áudio, Estado Normal com os 4 modos placeholder `hall_da_fama`/`corrida_animais`/
`roleta_fazenda`/`estatisticas`, exibindo o modo definido em `config.modo_apresentacao` sem
rotação automática — troca apenas via evento de premiação ou controle remoto (FASE 15), Estado
Evento placeholder para a Etapa 1); `js/realtime.js` (subscrições `eventos` INSERT pending e
`config` UPDATE); `js/fila-eventos.js` (fila local da seção 7: boot reseta
`processing→pending`, carrega pendentes, processa 1 a 1 marcando
`processing`→(placeholder)→`revealed`); `assets/css/tv.css` (estilos da TV). Removidos
`config.rotacao_automatica`/`intervalo_rotacao_segundos` (schema.sql/seed.sql) — não fazem mais
parte do design. Testado em `http://localhost:8123/tv/index.html`.

✅ **FASE 5 concluída** — `assets/css/animacoes.css` (animações da Etapa 1: tremer/brilhar do
baú, partículas/estrelas voando, entrada da revelação, efeitos exclusivos do Tesouro);
`js/animacoes.js` (`executarRevelacao`, sequência Suspense → Baú → Revelação → Encerramento
com durações configuráveis em `DURACOES`, troca para som/efeito do Tesouro quando
`evento.metadata.is_tesouro === true`); `js/sons.js` (`desbloquear`/`tocar`, pré-carrega
`suspense`/`bau`/`vitoria`/`tesouro` de `assets/audio/`). `tv/index.html` reestruturado com as
4 etapas do Estado Evento e ligado a `executarRevelacao`; botão "Iniciar TV" agora chama
`desbloquear()` do `js/sons.js`. Testado em `http://localhost:8123/tv/index.html`.

✅ **FASE 6 concluída** — `js/halldafama.js` (`inicializarHallDaFama`/`atualizarTesouroStatus`:
carrega `vw_hall_da_fama` (até 15 ganhadores mais recentes, com foto, prêmio, categoria e
data/hora) em um carrossel de 3 cards por vez com transição suave (fade, troca automática a
cada 7s), `vw_estatisticas` (total entregues/raros/lendários) e o status do Tesouro da
Fazenda, com destaque visual quando `encontrado`); `js/realtime.js` ganhou
`subscribeHallDaFama` (canal `tv-hall`, `eventos` UPDATE → `delivered`/`completed`) para
atualizar tudo automaticamente. Seção `hall_da_fama` reestruturada em `tv/index.html`
(cabeçalho compacto com título + Tesouro + contadores, carrossel central com fotos em
destaque ocupando a maior parte da tela) com novos estilos em `assets/css/tv.css`, pensados
para TV 50" mas responsivos. Testado em `http://localhost:8123/tv/index.html`.

✅ **FASE 7 concluída** — `dashboard/entregas-pendentes.html` + `js/entregas.js`:
lista `vw_entregas_pendentes` ("Aguardando entrega") e eventos `delivered` sem `foto_url`
("Aguardando foto", para reenvio); modal "Registrar Entrega" com captura via câmera
(`capture="environment"`) ou galeria, compressão client-side em `<canvas>` (~1280px, JPEG 0.8)
e preview. Ao confirmar: upload para o bucket `fotos` (`{evento_id}.jpg`), `eventos.status`
vira `completed` (com foto) ou `delivered` (sem foto, permite reenvio depois),
`premios.status='entregue'` e, se o snapshot indicar Tesouro, `config.tesouro_status=
'encontrado'`. `js/realtime.js` ganhou `subscribeEntregasPendentes` (canal
`dashboard-entregas`, `eventos` UPDATE → `revealed`/`delivered`/`completed`) para atualizar as
listas sem reload. Testado em `http://localhost:8123/dashboard/entregas-pendentes.html`
(2 eventos `revealed` de teste — "Teste"/P-001 — disponíveis para registrar entrega).

▶️ Próximo passo: **FASE 8** (Realtime: Consolidação e Resiliência).
