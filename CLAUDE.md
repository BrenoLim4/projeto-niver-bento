# CLAUDE.md

## Visão Geral do Projeto

Este projeto consiste em uma plataforma web de premiações interativas desenvolvida para o aniversário de 1 ano do Bento, com tema "Fazendinha do Bento".

O sistema será utilizado durante a festa para controlar brincadeiras, distribuir prêmios, exibir animações em uma TV e registrar os ganhadores em tempo real.

O objetivo não é apenas realizar sorteios, mas criar uma experiência visual e emocional para os convidados, transformando cada premiação em um momento especial.

---

# Conceito Principal

A aplicação é baseada em eventos.

Qualquer brincadeira ou atividade pode gerar uma premiação.

Quando uma premiação é gerada:

1. O evento é registrado no Supabase.
2. O evento é transmitido em tempo real através do Supabase Realtime.
3. A TV recebe o evento.
4. Uma animação é executada.
5. O prêmio é revelado.
6. O prêmio é entregue.
7. Uma foto do ganhador é registrada.
8. O Hall da Fama é atualizado automaticamente.

Fluxo:

Brincadeira → Evento → Animação → Revelação → Entrega → Foto → Hall da Fama

---

# Tema

Nome oficial:

Fazendinha do Bento

Toda a aplicação deve utilizar a identidade visual da festa.

O Bento é o personagem principal do sistema.

Sempre que possível, o Bento deve aparecer como mascote das telas e animações.

---

# Identidade Visual

Inspirada em:

* Fazenda ao pôr do sol
* Chapéu de palha
* Celeiro
* Animais da fazenda
* Camisa xadrez vermelha
* Tons dourados e terrosos

Paleta principal:

Dourado:
#F2A64A

Marrom:
#8B5A2B

Bege:
#F5E6C8

Verde:
#6F8C52

Vermelho:
#B63E3E

Branco:
#FFF8EF

---

# Stack Tecnológica

Frontend:

* HTML
* CSS
* JavaScript Vanilla

Backend:

* Supabase Database
* Supabase Storage
* Supabase Realtime

A aplicação deve ser simples e sem frameworks.

Priorizar:

* Baixa complexidade
* Facilidade de manutenção
* Performance

---

# Arquitetura Geral

Existem dois tipos principais de telas.

## Dashboard Administrativo

Utilizado pelo organizador da festa.

Responsável por:

* Controlar a TV
* Iniciar brincadeiras
* Registrar ganhadores
* Fazer upload de fotos
* Gerenciar prêmios
* Visualizar estatísticas

---

## Tela TV

Exibida para todos os convidados.

Possui dois estados.

### Estado Normal

Exibe uma das telas selecionadas:

* Hall da Fama
* Corrida dos Animais
* Roleta da Fazenda
* Estatísticas

### Estado Evento

Quando uma premiação acontece:

* Interrompe a tela atual
* Exibe animação
* Revela o prêmio
* Retorna automaticamente para a tela anterior

---

# Dashboard Principal

O dashboard deve possuir cards com imagens temáticas.

Itens:

* Hall da Fama
* Corrida dos Animais
* Roleta da Fazenda
* Estatisticas
* Gerenciamento de Prêmios
* Ganhadores

O Hall da Fama deve ser a tela padrão da TV.

---

# Hall da Fama

Tela principal exibida quando não houver eventos.

Exibir:

* Fotos dos ganhadores
* Nome do ganhador
* Prêmio recebido
* Data e hora
* Quantidade de prêmios distribuídos
* Quantidade de prêmios raros
* Quantidade de prêmios lendários

Também exibir:

Status do Tesouro da Fazenda

Possíveis valores:

* Ainda não encontrado
* Encontrado

---

# Sistema de Premiações

Todos os prêmios possuem:

* Código
* Nome
* Descrição
* Imagem
* Categoria
* Status

Categorias:

* Comum
* Raro
* Lendário

Status:

* Disponível
* Entregue

---

# Tesouro da Fazenda

Prêmio especial.

Características:

* Existe apenas um
* Possui animação exclusiva
* Possui destaque no Hall da Fama
* Possui efeitos especiais

---

# Brincadeiras

## Pescaria

Peixes físicos possuem QR Code.

Cada QR Code está associado a um prêmio.

Ao escanear:

* O evento é criado
* A TV recebe o evento
* A animação é iniciada

---

## Jogo da Memória

O jogo da memória NÃO será digital.

Será realizado fisicamente durante a festa.

Cada par de cartas encontrado possuirá um QR Code associado a uma premiação.

Ao encontrar um par:

* O participante localiza o QR Code correspondente
* O QR Code é escaneado
* O sistema identifica a premiação vinculada ao par encontrado
* Um evento é criado automaticamente
* A TV recebe o evento em tempo real
* A animação de revelação é iniciada

O fluxo segue o mesmo conceito da pescaria, porém adaptado ao contexto do jogo da memória.

A partir desse ponto segue o fluxo normal de premiação.

---

## Corrida dos Animais

Tela digital.

Exibe animais correndo.

Exemplos:

* Cavalo
* Vaca
* Porco
* Galinha

Ao finalizar:

* Define vencedor
* Gera premiação

---

## Roleta da Fazenda

Tela digital.

Possui animação de rotação.

Pode conter:

* Prêmios
* Categorias
* Surpresas

Ao finalizar:

* Dispara premiação

---

# Sistema de Eventos

Toda premiação deve gerar um evento.

Tabela conceitual:

eventos

Campos:

* id
* tipo
* premio_id
* vencedor
* status
* created_at

Status:

* pending
* processing
* completed

---

# Fila de Eventos

A TV nunca deve interromper uma animação em andamento.

Se múltiplos eventos chegarem:

* Devem entrar em fila
* Devem ser processados em sequência

Fluxo:

Evento 1
↓
Evento 2
↓
Evento 3

A TV processa um por vez.

---

# Sistema de Animação

Quando uma premiação acontece.

Etapa 1:

Tela de suspense.

Mensagem:

"Bento encontrou um presente para você!"

---

Etapa 2:

Animação de baú.

O baú deve:

* Tremer
* Brilhar
* Emitir partículas

---

Etapa 3:

Revelação.

Exibir:

* Nome do prêmio
* Imagem do prêmio
* Código do prêmio
* Nome do ganhador

---

Etapa 4:

Encerramento.

Retornar para a tela anterior.

---

# Sistema de Fotos

Após entregar o prêmio:

O operador poderá:

* Tirar foto
  ou
* Enviar foto

A foto deve ser enviada para o Supabase Storage.

Após o upload:

* Associar ao ganhador
* Exibir automaticamente no Hall da Fama

---

# Estatísticas

Exibir:

* Total de premiações
* Total entregues
* Total pendentes
* Comuns
* Raros
* Lendários

---

# Realtime

Utilizar Supabase Realtime para:

* Novos eventos
* Atualização do Hall da Fama
* Atualização das estatísticas
* Atualização de status de prêmios

Não utilizar polling.

Toda comunicação deve ocorrer em tempo real.

---

# UX

Objetivos:

* Visual infantil
* Aparência premium
* Experiência emocionante
* Poucos cliques
* Fácil utilização durante a festa

O organizador deve conseguir operar o sistema rapidamente usando apenas um celular.

A TV deve ser capaz de permanecer ligada durante toda a festa exibindo conteúdo automaticamente.

---

# Diretrizes de Desenvolvimento

Sempre priorizar:

* Simplicidade
* Código limpo
* Componentização
* Reutilização

Evitar:

* Dependências desnecessárias
* Frameworks complexos
* Soluções excessivamente sofisticadas

O sistema deve funcionar integralmente utilizando apenas HTML, CSS, JavaScript e Supabase.
