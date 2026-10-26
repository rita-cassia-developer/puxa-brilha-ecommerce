# Entregas do protótipo Puxa e Brilha

## Marketplace profissional
- A vitrine deve apresentar header de marketplace com busca central, categorias, acesso administrativo, favoritos e carrinho.
- A experiência deve usar cores com intenção comercial e psicológica: coral para ação, amarelo para ofertas, azul marinho para confiança, branco/cinza para comparação e verde para segurança.
- A interface deve usar tipografia sans-serif legível, com capitalização correta em títulos, labels, botões e mensagens.

## Catálogo e conversão
- O usuário deve conseguir buscar, filtrar por categoria, ordenar por preço e ver cards com preço, preço anterior, desconto, avaliação, vendidos, parcelamento e CTA.
- O catálogo inicial deve conter pelo menos 10 produtos distintos em cada categoria Rosto, Corpo, Cabelos, Fragrâncias e Maquiagem; a busca por “batom” deve retornar produtos.
- O usuário deve conseguir adicionar produtos, alterar quantidades, remover itens e revisar subtotal, frete e total.

## Frete e checkout
- O usuário deve informar endereço/CEP e calcular frete simulado com prazo e valor antes da confirmação.
- O usuário deve poder escolher “Receber em casa” ou “Retirar na loja”; ao retirar, o checkout deve mostrar o endereço da Loja Puxa e Brilha, dispensar CEP/endereço de entrega, exibir frete grátis e prazo de preparo.
- O pagamento deve oferecer botões clicáveis de Pix, cartão de crédito e boleto em ambiente explicitamente demonstrativo, sem cobrança real; o cartão pode exibir campos de teste e o pedido deve registrar o método escolhido.
- Após confirmar, o checkout deve apresentar pedido simulado, forma de pagamento e prazo de entrega.

## Painel administrativo
- `/admin` deve permitir adicionar produtos com nome, categoria, preço, estoque, selo, nota e descrição.
- `/admin` deve permitir editar e remover produtos com confirmação.
- As alterações devem persistir no navegador, aparecer na vitrine e atualizar métricas do painel.

## Estabilidade
- A demonstração não deve depender de login, CEP real, gateway, imagens remotas ou API externa.
- Deve existir catálogo inicial, validação de campos, fallback visual, estados vazios e mensagens de confirmação.

## Responsividade mobile
- Em celulares, a loja deve manter o acesso “Área administrativa” visível no canto superior direito, junto do carrinho.
- O botão de menu sanduíche deve abrir e fechar um menu funcional com categorias e atalho para o painel administrativo.
- A vitrine e o checkout devem se ajustar a telas pequenas sem cortar controles essenciais ou exigir rolagem horizontal.

## Atualização solicitada pela cliente — catálogo e parceiros
- O catálogo público pode permanecer sem produtos enquanto os itens reais estão em produção; o produto demonstrativo existente foi mantido como rascunho, com preço zero e sem exibição na vitrine.
- O painel administrativo deve permitir o cadastro manual de parceiros com nome, e-mail, WhatsApp, tipo de parceiro e comissão.
- Os tipos de parceiro disponíveis são Representante, Vendedor e Distribuidor; todos recebem identificação própria, link de indicação, leads, pedidos e comissões no banco.
- A proprietária poderá cadastrar os produtos reais posteriormente, incluindo foto, preço, peso, estoque, descrição e categoria.
