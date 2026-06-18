FASE 14 — Roleta da Fazenda

Objetivo:

Implementar uma roleta temática da Fazendinha do Bento como modo especial da TV e mecanismo de seleção de vencedores para premiações, utilizando animais da fazenda ilustrados em estilo cartoon premium.

Escopo:

dashboard/roleta.html

* Tela administrativa para iniciar uma rodada.
* Seleção dos participantes.
* Sorteio determinístico do animal vencedor.
* Criação do evento de roleta.
* Registro do animal vencedor em events.metadata.
* Integração com o fluxo normal de premiação.

Estrutura dos Assets

assets/img/roleta/

* vaca.webp
* cavalo.webp
* porco.webp
* galinha.webp
* ovelha.webp
* cabra.webp
* pato.webp
* pintinho.webp

TV — modo roleta_fazenda

Implementar novo modo de apresentação:

roleta_fazenda

Características:

* Roleta central em tela cheia.
* 8 setores ilustrados.
* Cada setor representa um animal da fazenda.
* Indicador fixo no topo.
* Animação de giro suave.
* Compatível com TV Full HD.
* Visual premium infantil.

Animais da Roleta

🐄 Vaca Mimosa

🐴 Cavalo Trovão

🐷 Porquinho Baconzinho

🐔 Galinha Cocó

🐑 Ovelha Floquinha

🐐 Cabrita Estrelinha

🦆 Patinho Pingo

🐣 Pintinho Amarelinho

Visual

Cada setor da roleta deve possuir:

* Ilustração do animal
* Cor própria
* Ícone do animal
* Fundo colorido
* Destaque ao passar pelo ponteiro

Mecânica da Roleta

Fluxo:

1. Dashboard cria evento.
2. TV recebe evento via Supabase Realtime.
3. TV muda para modo roleta_fazenda.
4. Controle da TV inicia a roleta (dependente da fase 15).
5. Som de giro é reproduzido.
6. Roleta acelera.
7. Roleta mantém velocidade constante.
8. Roleta desacelera gradualmente.
9. Animal vencedor para exatamente no ponteiro.
10. Resultado é exibido.
11. Fluxo segue para a revelação do prêmio.

Importante:

O animal vencedor deve ser definido antes da animação.

A animação deve apenas representar visualmente o resultado já sorteado.

Evitar qualquer possibilidade de divergência entre resultado visual e resultado registrado.

Critério visual obrigatório:

O animal vencedor deve ficar claramente destacado.

Efeitos Visuais

Durante o giro:

* Brilho suave nos setores.
* Pequenas partículas.
* Destaque do setor ativo.

Ao parar:

* Explosão de confetes.
* Brilho no setor vencedor.
* Zoom suave.
* Vibração visual da roleta.

Efeitos Sonoros

Arquivos:

assets/audio/

* roleta-girando.mp3
* roleta-clique.mp3
* roleta-vencedor.mp3

Fluxo:

* Som contínuo durante o giro.
* Cliques conforme os setores passam pelo ponteiro.
* Som especial ao parar.

Metadados do Evento

Salvar em events.metadata:

{
"tipo": "roleta_fazenda",
"animal_vencedor": "vaca",
"participantes": [
"vaca",
"cavalo",
"porco",
"galinha",
"ovelha",
"cabra",
"pato",
"pintinho"
]
}

Integração com Premiações

Ao final da roleta:

* Sistema realiza sorteio de prêmio elegível para roleta.
* Cria evento de premiação.
* Fluxo segue normalmente para:

  * animação do baú
  * revelação
  * entrega
  * Hall da Fama

Critérios de Aceite

* Roleta executa em tela cheia.
* Todos os animais utilizam imagens da pasta assets/img/roleta.
* Giro visual suave.
* Ponteiro fixo.
* Resultado visualmente evidente.
* Integração Realtime funcionando.
* Sons funcionando.
* Fluxo segue automaticamente para premiação.
* Compatível com TV Full HD.

Dependências

* FASE 2
* FASE 5
* FASE 6

Entregáveis

dashboard/roleta.html

js/roleta.js

tv/index.html

* novo modo roleta_fazenda

tv/animacoes.js

* animação da roleta
* integração realtime
* efeitos sonoros
* partículas e confetes