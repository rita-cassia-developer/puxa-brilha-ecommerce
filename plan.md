# Plano — Lumera Cosméticos Essenciais

## Escopo
Protótipo navegável de e-commerce para demonstração a cliente, com vitrine de cosméticos, busca e filtros, carrinho, cálculo de frete simulado por CEP/endereço, checkout com pagamento explicitamente simulado e painel administrativo para adicionar, editar, remover e visualizar produtos.

## Abordagem de implementação
- Frontend React + TypeScript com estado local e `localStorage` para que a demonstração funcione sem login, APIs externas, gateways ou CEP real.
- Catálogo inicial em memória com persistência local; alterações do administrador refletem imediatamente na vitrine.
- Rotas SPA para `/` e `/admin`, sem depender de navegação de servidor.
- Fluxo de checkout em drawer/modal com revisão de itens, endereço, cálculo determinístico de frete por região do CEP e confirmação de pagamento fake.
- Dados vazios, validação de formulários, fallback de imagens e mensagens de confirmação para evitar estados quebrados durante o teste.
- Backend/DB permanecem habilitados no projeto, mas o protótipo de apresentação não dependerá deles para a jornada principal.

## Direção visual escolhida
### Alternativas consideradas
- Neo-apotecário editorial — 0,07: cosméticos como objetos de laboratório sofisticado, com layout de revista.
- **Quiet luxury botânico — 0,06 (escolhido):** luxo silencioso, matéria-prima natural e interface de boutique.
- Pop clínico vibrante — 0,08: blocos saturados e linguagem de beleza mais energética.

### Design Movement
Quiet luxury botânico, inspirado em editoriais de skincare premium, embalagens de farmácia francesa e interiores com pedra clara.

### Core Principles
1. Respiro e foco: grandes áreas claras, hierarquia tipográfica e poucos elementos por vez.
2. Produto protagonista: cards e detalhes com enquadramento de still life, sem aparência de marketplace.
3. Confiança demonstrável: microcopy transparente, estados de pedido claros e checkout didático.
4. Admin como ferramenta: painel compacto e operacional, visualmente conectado à marca.

### Color Philosophy
Base marfim quente e areia para criar sensação tátil e calma; grafite esverdeado para legibilidade; verde oliva profundo como assinatura proprietária; terracota pontual para sinalizar novidade e ação sem parecer promocional agressivo.

### Layout Paradigm
Composição editorial assimétrica: navegação horizontal arejada, hero dividido em manifesto + composição de produto, seções em faixas e grids de cards apenas onde ajudam a comparar itens.

### Signature Elements
- Linha vertical oliva e selo monograma `L` nos pontos de assinatura.
- Fundos granulados/papel e cards com cantos suaves, bordas finas e sombras quase imperceptíveis.
- Selos de categoria como pequenas etiquetas editoriais (“ritual”, “essencial”, “novo”).

### Interaction Philosophy
Toda ação dá retorno imediato e explícito: item adicionado, frete calculado, produto salvo e pedido simulado confirmado. Formulários aceitam preenchimento progressivo e não descartam dados ao trocar de etapa.

### Animation
Entradas curtas e discretas (150–220ms), cards elevando 2–4px no hover, drawer do carrinho deslizando da direita e confirmação final com transição de opacidade/escala. Sem animação contínua que distraia a demonstração.

### Typography System
Serif editorial `Cormorant Garamond` para títulos e números de destaque; sans `DM Sans` para navegação, labels e dados operacionais. Títulos em caixa normal com tracking negativo moderado; microcopy em sans com contraste alto.

### Brand Essence
Cosméticos essenciais para rituais de autocuidado que cabem na vida real — refinada, sensorial, honesta.

### Brand Voice
Headlines: calmas, sensoriais e específicas. CTAs: diretos, sem urgência artificial.
- “O essencial, em sua melhor forma.”
- “Adicionar ao ritual”

### Wordmark & Logo
Wordmark `lumera` em serif fina com um pequeno arco acima do `u`, acompanhado do monograma `L` em círculo para favicon e selos.

### Signature Brand Color
Oliva mineral `#5C664A`.

## Estrutura do projeto
- `client/src/App.tsx`: rotas e shell principal.
- `client/src/pages/Home.tsx`: vitrine, hero, catálogo, carrinho e checkout.
- `client/src/pages/Admin.tsx`: painel administrativo e formulário de produto.
- `client/src/lib/store.ts`: modelos, seed, persistência local, carrinho e cálculo de frete.
- `client/src/index.css`: tokens visuais, layout responsivo e animações.
- `public/manus-routes.json`: manifesto das rotas públicas do protótipo.

## Restrições de demonstração
Nenhum pagamento real, integração de frete real ou login obrigatório. Os textos e controles devem indicar “simulação” quando houver risco de o cliente interpretar a operação como transação real.
