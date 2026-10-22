# Plano — Lumera Marketplace de Cosméticos

## Atualização de direção
A experiência foi reposicionada de boutique editorial para marketplace de grande escala, inspirada nos padrões de descoberta e conversão de grandes e-commerces globais, sem copiar marcas: busca central protagonista, navegação por categorias, oferta em destaque, filtros, ordenação, cards comerciais e confiança visível.

## Psicologia das cores
- **Laranja coral (`#f4512a`)**: cor de ação e conversão; chama atenção para ofertas, botões e momentos de decisão sem parecer agressiva.
- **Amarelo solar (`#ffd42a`)**: comunica energia, descoberta e oportunidade nas áreas promocionais.
- **Azul marinho (`#162d4d`)**: sustenta credibilidade, segurança e organização institucional.
- **Branco e cinza muito claro (`#f7f8fa`)**: reduzem ruído visual e deixam produtos e preços fáceis de comparar.
- **Verde (`#218b64`)**: reservado para confiança, status ativo e informações de entrega/segurança.

## Tipografia
Troca da serif editorial por uma sans-serif de interface (Inter/Arial fallback), com pesos 400–800. A prioridade é legibilidade de preço, busca, filtros e dados administrativos; títulos continuam com hierarquia forte, mas sem aparência decorativa ou gerada.

## Componentes principais
- Header com promessa de segurança, logo, busca ampla, acesso administrativo, favoritos e carrinho.
- Navegação horizontal por categorias.
- Hero promocional com oferta, CTA primário e promessa de frete.
- Faixa de benefícios para reduzir insegurança.
- Categorias visuais, filtros, ordenação, cards com avaliação, vendidos, desconto, parcelamento e ação de compra.
- Checkout simulado com CEP, endereço, frete determinístico, métodos de pagamento e confirmação explícita.
- Painel `/admin` com CRUD local: adicionar, editar, remover, preço, estoque, categoria, selo, nota e descrição. Alterações ficam persistidas no navegador e aparecem na vitrine.

## Robustez de demonstração
A jornada não depende de CEP real, gateway, login ou API externa. O carrinho, catálogo e alterações do painel usam `localStorage`, com validações e estados de erro. Pagamento é sempre identificado como simulado.
