# Entregas do protótipo Lumera

## Vitrine profissional de cosméticos
- A página inicial deve apresentar uma loja de cosméticos com navegação, hero da marca, categorias, produtos em destaque, preços, badges e CTAs funcionais.
- O protótipo deve manter linguagem visual consistente de boutique premium e ser responsivo para desktop e mobile.

## Carrinho e jornada de compra
- O usuário deve conseguir adicionar produtos, alterar quantidades, remover itens e revisar subtotal, frete e total.
- O carrinho deve abrir sem recarregar a página e apresentar estado vazio quando não houver itens.

## Cálculo de frete simulado
- O usuário deve informar endereço/CEP no checkout e conseguir calcular frete através do endereço.
- O cálculo deve ser simulado, determinístico e apresentar prazo e valor antes da confirmação.
- CEP inválido ou incompleto deve gerar orientação clara sem quebrar o fluxo.

## Ambiente de pagamento simulado
- O checkout deve permitir escolher cartão, Pix ou boleto em ambiente demonstrativo.
- O protótipo não pode processar pagamento real e deve deixar explícito que a confirmação é simulada.
- Após confirmar, deve apresentar sucesso com número de pedido demonstrativo e opção de voltar à loja.

## Painel administrativo de produtos
- Deve existir painel administrativo navegável em `/admin`.
- O administrador deve conseguir adicionar produtos, inserir nome, categoria, preço, estoque, descrição, selo e imagem.
- O administrador deve conseguir editar e remover produtos com confirmação.
- As alterações devem aparecer na vitrine durante a demonstração e persistir no navegador.
- O painel deve apresentar métricas resumidas e estados vazios/feedback para ações concluídas.

## Estabilidade da demonstração
- A jornada principal não deve depender de serviços externos, CEP real, gateway de pagamento, login ou dados remotos.
- Deve haver catálogo inicial funcional, fallback de imagens, validações de formulário e persistência local para recarregamentos.
