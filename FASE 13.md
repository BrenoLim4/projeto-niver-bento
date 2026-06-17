FASE 13 — Corrida dos Tratores da Fazendinha do Bento + Tesouro da Fazenda

Objetivo:
Implementar a Corrida dos Tratores como modo especial da TV e mecanismo de seleção de vencedores para premiações, utilizando cenário temático da Fazendinha do Bento, 5 tratores exclusivos do Bento e animação exclusiva para o Tesouro da Fazenda.

Escopo:

dashboard/corrida.html

* Tela administrativa para iniciar corridas.
* Seleção dos participantes.
* Sorteio determinístico do vencedor.
* Criação do evento de corrida.
* Registro do trator vencedor em events.metadata.
* Integração com o fluxo normal de premiação.

Estrutura dos assets:

assets/img/tratores/

* bento-vermelho.webp
* bento-azul.webp
* bento-verde.webp
* bento-amarelo.webp
* bento-laranja.webp

assets/img/cenario/

* ceu.webp
* fundo.webp
* cercas.webp
* pista.webp

TV — modo corrida_tratores

Implementar novo modo de apresentação:

corrida_tratores

Substituindo a antiga corrida_animais.

Características:

* Corrida com 5 raias fixas.
* Cada trator ocupa sua própria raia.
* Linha de largada à esquerda.
* Linha de chegada à direita.
* Ambiente totalmente temático da Fazendinha do Bento.
* Corrida executada em tela cheia.
* Compatível com TV Full HD.

Sistema de Parallax

Implementar cenário em múltiplas camadas:

Camada 1:

* Céu
* Nuvens

Movimento:

* Muito lento

Camada 2:

* Colinas
* Árvores
* Celeiro
* Milharal

Movimento:

* Lento

Camada 3:

* Cercas
* Flores
* Arbustos

Movimento:

* Médio

Camada 4:

* Pista de corrida

Movimento:

* Quase estático

Objetivo:

Criar sensação de velocidade sem aumentar significativamente o custo computacional.

Mecânica da Corrida

Fluxo:

1. Dashboard cria evento.
2. TV recebe evento via Supabase Realtime.
3. TV muda para modo corrida_tratores.
4. Controle da TV inicia a corrida(depende da fase 15)
5. Exibe contagem regressiva:

3
2
1
VAI!

5. Corrida inicia.
6. Todos os tratores movimentam-se com pequenas variações visuais aleatórias.
7. O vencedor já está definido antes da animação.
8. Nos momentos finais o vencedor assume a liderança.
9. Cruza a linha de chegada.
10. Resultado é exibido.
11. Fluxo segue para a revelação do prêmio.

Importante:

A corrida deve parecer aleatória visualmente, porém o vencedor deve ser determinístico para evitar empates e inconsistências.

Critério visual obrigatório:

O vencedor deve ser claramente identificado ao final da corrida.

Efeito de Poeira

Todos os tratores devem gerar efeito visual de poeira durante a movimentação.

Características:

opacity: 0.3;
filter: blur(4px);

Objetivo:

Simular deslocamento na estrada de terra da fazenda.

Implementação leve utilizando CSS e animações simples.

Metadados do Evento

Salvar em events.metadata:

{
"tipo": "corrida_tratores",
"trator_vencedor": "verde",
"participantes": [
"vermelho",
"azul",
"verde",
"amarelo",
"laranja"
]
}

Integração com Premiações

Ao final da corrida:

* Sistema realiza sorteio de prêmio elegível para corrida.
* Cria evento de premiação.
* Fluxo segue normalmente para:

  * animação do baú
  * revelação
  * entrega
  * Hall da Fama

Tesouro da Fazenda

Manter animação exclusiva quando:

evento.snapshot.is_tesouro = true

Características especiais:

* Mais brilho
* Mais partículas
* Duração maior
* Som exclusivo tesouro.mp3
* Destaque visual diferenciado

Ao concluir:

config.tesouro_status = "encontrado"

Hall da Fama

Quando o Tesouro da Fazenda for encontrado:

* Destacar visualmente o evento.
* Exibir selo especial.
* Atualizar indicador permanente de tesouro encontrado.

Critérios de Aceite

* Corrida executa em 5 raias independentes.
* Todos os tratores utilizam imagens da pasta assets/img/tratores.
* Cenário utiliza imagens da pasta assets/img/cenario.
* Sistema de parallax funcionando.
* Efeito de poeira funcionando.
* Contagem regressiva funcionando.
* Vencedor visualmente evidente.
* Integração Realtime funcionando.
* Fluxo segue para premiação automaticamente.
* Tesouro dispara animação exclusiva.
* Tesouro atualiza tesouro_status.
* Hall da Fama exibe destaque do Tesouro.

Dependências

* FASE 2
* FASE 5
* FASE 6
* FASE 11

Entregáveis

dashboard/corrida.html

js/corrida.js

tv/index.html

* novo modo corrida_tratores

tv/animacoes.js

* animação da corrida
* efeito de poeira
* integração com parallax
* variação exclusiva Tesouro da Fazenda
