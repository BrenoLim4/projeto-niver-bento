Segue um prompt completo para enviar ao Claude:

```text
Leia integralmente o CLAUDE.md e o ROADMAP.md antes de qualquer implementação.

Quero implementar uma nova brincadeira completa no projeto:

CAÇA AO TESOURO DA FAZENDINHA DO BENTO

Essa brincadeira deve seguir a arquitetura atual do sistema, usando HTML, CSS, JavaScript Vanilla, Supabase Database, Supabase Storage e Supabase Realtime.

Objetivo da brincadeira:
Criar uma caça ao tesouro individual, onde cada participante se cadastra, procura animais perdidos pela festa, desbloqueia o tesouro, responde uma charada sincronizada com a TV e, se acertar, dispara a animação especial do Tesouro da Fazenda.

---

# Fluxo Geral

1. Participante escaneia um QR Code inicial da brincadeira.
2. Abre uma tela de cadastro.
3. Participante informa:
   - Nome
   - Foto opcional
4. Se enviar foto, salvar no Supabase Storage.
5. Sistema cria o participante.
6. Participante entra em uma tela interativa da caça ao tesouro.
7. Nessa tela existe:
   - Nome do participante
   - Foto do participante, se houver
   - Scanner QR Code
   - Lista/progresso dos animais encontrados
   - Contador: animais encontrados / animais necessários
   - Status: Tesouro bloqueado ou desbloqueado
8. Existem 10 animais perdidos espalhados pela festa, cada um com QR Code próprio.
9. Ao escanear um animal:
   - Sistema valida o QR Code.
   - Registra o animal encontrado para aquele participante.
   - Não permite contar o mesmo animal duas vezes para o mesmo participante e nem por outros.
10. Ao encontrar a quantidade mínima necessária de animais, o tesouro fica desbloqueado para aquele participante.
11. O baú físico da festa terá um QR Code final: QR-TESOURO.
12. Ao escanear o QR-TESOURO:
   - Sistema verifica se o participante já desbloqueou o tesouro.
   - Se não desbloqueou, informa que precisa encontrar mais animais.
   - Se desbloqueou, inicia o desafio final.
13. O desafio final deve ser sincronizado com a TV.
14. A TV exibe a charada.
15. O participante responde pelo celular.
16. A TV exibe se acertou ou errou.
17. Se errar:
   - Aplicar cooldown de 20 segundos.
   - Participante poderá tentar novamente depois.
18. Se acertar:
   - Sistema marca o Tesouro da Fazenda como encontrado.
   - Cria evento especial do Tesouro.
   - TV executa animação exclusiva.
   - Depois segue fluxo normal de entrega e Hall da Fama.

---

# Regras da Brincadeira

- A brincadeira é individual.
- Não existem equipes.
- Os participantes não podem registrar o mesmo animal duas vezes.
- Existem 10 animais disponíveis.
- A quantidade para desbloquear o tesouro deve ser configurável.
- Valor inicial recomendado: 3 animais diferentes.
- O tesouro só pode ter um vencedor.
- Depois que o tesouro for encontrado, novos participantes não podem mais vencer o tesouro.
- O sistema deve informar claramente que o Tesouro da Fazenda já foi encontrado.
- O QR Code do baú não deve liberar a charada se o participante não tiver animais suficientes.
- O participante pode encontrar os animais em qualquer ordem.
- Os QR Codes dos animais são independentes.
- A TV não deve revelar onde estão os animais.
- A TV pode mostrar estatísticas gerais da brincadeira.

---

# Animais Perdidos

Criar suporte para 10 animais:

1. Vaca Mimosa
2. Cavalo Trovão
3. Porquinho Baconzinho
4. Galinha Cocó
5. Ovelha Floquinha
6. Cabrita Estrelinha
7. Patinho Pingo
8. Pintinho Amarelinho
9. Cachorrinho Rex
10. Gatinho Mingau

Cada animal deve possuir:

- Código QR
- Nome
- Emoji
- Imagem opcional
- Status ativo

Exemplos de códigos:

ANIMAL-VACA
ANIMAL-CAVALO
ANIMAL-PORCO
ANIMAL-GALINHA
ANIMAL-OVELHA
ANIMAL-CABRA
ANIMAL-PATO
ANIMAL-PINTINHO
ANIMAL-CACHORRO
ANIMAL-GATO

QR final:

QR-TESOURO

---

# Tela de Cadastro

Criar rota/página:

jogos/tesouro/cadastro.html

Campos:

- Nome do participante
- Foto opcional do participante

Requisitos:

- Mobile-first.
- Visual Fazendinha do Bento.
- Foto opcional com upload para Supabase Storage.
- Usar input file com capture quando possível.
- Comprimir imagem no front-end antes do upload, usando canvas.
- Salvar o participante no banco.
- Após cadastro, salvar participante_id no localStorage.
- Redirecionar para a tela principal da brincadeira.

---

# Tela Principal do Participante

Criar rota/página:

jogos/tesouro/index.html

Exibir:

- Nome do participante
- Foto, se houver. Arredondada, tipo perfil(instagram, whatsapp, telegram...)
- Progresso: 0/3, 1/3, 2/3...
- Animais encontrados
- Status do tesouro:
  - Bloqueado
  - Desbloqueado
  - Encontrado
- Scanner QR Code
- Entrada manual de código como fallback

Comportamento:

- Ao escanear animal válido:
  - Registrar animal encontrado.
  - Atualizar progresso.
  - Mostrar feedback visual.
  - Animação na TV, sem informar quem encontrou, só o animal encontrado
- Ao escanear animal já encontrado:
  - Mostrar mensagem: "Esse animal já foi encontrado."
- Ao escanear QR-TESOURO:
  - Validar progresso.
  - Se bloqueado, mostrar quantos animais ainda faltam.
  - Se desbloqueado, iniciar desafio da charada.

---

# Sincronismo com TV

Quando um participante desbloqueado escanear QR-TESOURO:

1. Criar um registro de tentativa/desafio.
2. Enviar via Supabase Realtime para a TV.
3. TV entra no modo "tesouro_charada".
4. TV exibe:
   - Nome do participante
   - Foto, se houver
   - Charada
   - Alternativas
   - Estado aguardando resposta

No celular:

- Mostrar a mesma charada.
- Exibir alternativas.
- Participante escolhe uma resposta.

Após responder:

- Atualizar tentativa no banco.
- TV recebe atualização em tempo real.
- TV mostra:
  - Resposta correta
  - Resposta incorreta
  - Tesouro encontrado
  - Cooldown, se necessário

---

# Charadas

Criar tabela de charadas.

Cada charada deve possuir:

- Pergunta
- Alternativa A
- Alternativa B
- Alternativa C
- Alternativa D
- Alternativa correta
- Ativa

Criar seed com pelo menos 10 charadas simples e temáticas.

Exemplos:

1. Onde o Bento recebe os parabéns?
A) Entrada
B) Mesa do bolo
C) Cozinha
D) Estacionamento
Resposta: B

2. Qual animal faz "muuu"?
A) Vaca
B) Galinha
C) Pato
D) Cavalo
Resposta: A

3. Qual veículo corre na Fazendinha do Bento?
A) Avião
B) Trator
C) Barco
D) Moto
Resposta: B

4. O que a galinha bota?
A) Ovo
B) Milho
C) Leite
D) Cenoura
Resposta: A

5. Qual animal gosta de milho?
A) Galinha
B) Peixe
C) Leão
D) Tubarão
Resposta: A

---

# Banco de Dados

Criar scripts SQL em:

supabase/tesouro_schema.sql

e, se necessário, atualizar:

supabase/schema.sql
supabase/seed.sql

Criar ou ajustar as seguintes tabelas:

## tesouro_participantes

Campos sugeridos:

- id uuid primary key default gen_random_uuid()
- nome text not null
- foto_url text null
- created_at timestamptz default now()
- updated_at timestamptz default now()

## tesouro_animais

Campos sugeridos:

- id uuid primary key default gen_random_uuid()
- codigo text unique not null
- nome text not null
- emoji text
- imagem_url text null
- ativo boolean default true
- ordem int
- created_at timestamptz default now()

## tesouro_participante_animais

Campos sugeridos:

- id uuid primary key default gen_random_uuid()
- participante_id uuid references tesouro_participantes(id)
- animal_id uuid references tesouro_animais(id)
- created_at timestamptz default now()
- unique(participante_id, animal_id)

## tesouro_charadas

Campos sugeridos:

- id uuid primary key default gen_random_uuid()
- pergunta text not null
- alternativa_a text not null
- alternativa_b text not null
- alternativa_c text not null
- alternativa_d text not null
- resposta_correta text not null
- ativo boolean default true
- created_at timestamptz default now()

## tesouro_tentativas

Campos sugeridos:

- id uuid primary key default gen_random_uuid()
- participante_id uuid references tesouro_participantes(id)
- charada_id uuid references tesouro_charadas(id)
- status text not null
- resposta text null
- correta boolean null
- cooldown_until timestamptz null
- created_at timestamptz default now()
- answered_at timestamptz null

Status possíveis:

- aguardando_resposta
- respondida
- correta
- incorreta
- expirada

## config

Atualizar config para incluir:

- tesouro_min_animais int default 3
- tesouro_status text default 'nao_encontrado'
- tesouro_vencedor_participante_id uuid null
- modo_apresentacao text

---

# Views

Criar view:

vw_tesouro_ranking

Deve retornar:

- participante_id
- nome
- foto_url
- total_animais_encontrados
- tesouro_desbloqueado
- ultima_atualizacao

Criar view:

vw_tesouro_estatisticas

Deve retornar:

- total_participantes
- total_animais_encontrados
- total_desbloqueados
- tesouro_status
- tesouro_vencedor

---

# Storage Supabase

Criar bucket:

tesouro-participantes

Uso:

- Fotos dos participantes

Requisitos:

- Upload pelo front-end.
- Leitura pública.
- Nome dos arquivos:
  participante-{participante_id}.jpg

Também considerar reutilizar bucket fotos se fizer mais sentido, mas documentar a decisão.

Implementar compressão client-side:

- largura máxima 1280px
- formato JPEG
- qualidade 0.8

---

# RLS

Criar policies simples compatíveis com o projeto atual.

Como o sistema é de evento privado e curto:

- Permitir leitura pública com anon.
- Permitir inserção e atualização via anon para as tabelas necessárias.
- Documentar que isso é uma decisão consciente para contexto de festa privada.

---

# Integração com Sistema de Eventos

Quando o participante acertar a charada final:

1. Verificar se config.tesouro_status ainda é 'nao_encontrado'.
2. Se já foi encontrado, impedir vitória.
3. Se ainda não foi encontrado:
   - Atualizar config.tesouro_status = 'encontrado'.
   - Atualizar config.tesouro_vencedor_participante_id.
   - Criar evento especial na tabela eventos.
   - O evento deve possuir snapshot do Tesouro da Fazenda.
   - O evento deve acionar animação exclusiva do Tesouro na TV.

O evento deve seguir o ciclo normal:

pending
processing
revealed
delivered
completed

---

# TV

Atualizar tv/index.html e JS relacionado.

Novo modo:

tesouro_charada

A TV deve exibir:

- Tela ambiente da Caça ao Tesouro
- Estatísticas gerais da caça
- Participantes ativos
- Total de animais encontrados
- Quantos participantes já desbloquearam o tesouro
- Status do tesouro
- Quando houver tentativa ativa:
  - Nome do participante
  - Foto, se houver
  - Charada
  - Alternativas
  - Estado aguardando resposta
  - Resultado correto/incorreto
  - Animação do Tesouro quando vencer

---

# Dashboard Administrativo

Adicionar links no dashboard principal para:

- Caça ao Tesouro
- Participantes
- Estatísticas do Tesouro
- Reset/controle da brincadeira

Criar página:

dashboard/tesouro.html

Funções:

- Ver participantes
- Ver progresso
- Ver animais encontrados
- Ver tentativas
- Ver status do tesouro
- Resetar tesouro, se necessário
- Ajustar quantidade mínima de animais
- Ver charadas

---

# Assets

Criar estrutura:

assets/img/tesouro/
assets/img/tesouro/animais/
assets/audio/

Os arquivos podem ser placeholders inicialmente.

A implementação deve permitir substituição fácil.

---

# Critérios de Aceite

A implementação só será considerada concluída se:

1. Participante consegue se cadastrar.
2. Foto opcional é enviada para Supabase Storage.
3. participante_id fica salvo no localStorage.
4. Participante consegue escanear animais.
5. Mesmo animal não conta duas vezes.
6. Progresso atualiza corretamente.
7. Tesouro desbloqueia ao atingir quantidade mínima.
8. QR-TESOURO bloqueia quem não tem progresso suficiente.
9. QR-TESOURO cria tentativa para quem está apto.
10. TV recebe tentativa em tempo real.
11. TV exibe charada sincronizada.
12. Celular exibe alternativas.
13. Resposta atualiza TV em tempo real.
14. Erro aplica cooldown de 30 segundos.
15. Acerto marca Tesouro como encontrado.
16. Tesouro só pode ter um vencedor.
17. Evento especial do Tesouro é criado.
18. Animação especial do Tesouro é disparada na TV.
19. Dashboard mostra participantes e progresso.
20. Scripts SQL são criados em supabase/tesouro_schema.sql.
21. Seeds dos animais e charadas são criados.
22. Não quebrar os fluxos já existentes de pescaria, roleta, corrida, premiação livre e Hall da Fama.

---

# Importante

- Manter HTML, CSS e JavaScript Vanilla.
- Usar Supabase Database, Storage e Realtime.
- Não usar framework.
- Evitar dependências desnecessárias.
- Manter visual alinhado à identidade da Fazendinha do Bento.
- Implementar de forma incremental, mas entregar a brincadeira completa.
- Caso encontre inconsistências com o roadmap, atualizar ROADMAP.md antes de implementar.
```
