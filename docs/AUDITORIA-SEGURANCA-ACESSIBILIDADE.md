# Auditoria de segurança, acessibilidade e migração

## Resultado executado

- `pnpm check`: aprovado.
- `pnpm build`: aprovado.
- `pnpm test`: 2 arquivos, 6 testes aprovados.
- `GET /api/health`: HTTP 200 com `{"status":"ok"}`.
- `GET /manus-routes.json`: HTTP 200 com as rotas públicas declaradas.
- `pnpm audit --prod --audit-level=moderate`: sem vulnerabilidades moderadas, altas ou críticas. Restam 2 avisos baixos em dependências transitivas (`@smithy/config-resolver` e `katex`), sem rota de uso identificada na vitrine principal.

## Correções aplicadas

- Removido o header `X-Powered-By`.
- Adicionados `X-Content-Type-Options: nosniff`, `Referrer-Policy` e `Permissions-Policy`.
- Reduzido o limite de JSON/URL-encoded de 50 MB para 1 MB; este projeto não recebe upload pelo Express.
- Callback OAuth agora responde `400` para estado malformado e `403` para nonce inválido, sem lançar exceção não tratada.
- Atualizados Axios, MySQL2, Drizzle ORM, Nanoid, Zod e tRPC.
- Fixadas versões transitivas corrigidas para `qs`, Mermaid, DOMPurify, Lodash, UUID, fast-xml-parser, body-parser, path-to-regexp, mdast-util-to-hast e proxy-addr.
- Aplicado contraste reforçado a badges, estrelas de avaliação, números de etapas, categorias, overlines e botão de WhatsApp.
- Mantidos skip link global, foco visível, `prefers-reduced-motion`, labels/`aria-label` e diálogos com `aria-modal`.
- Testado no navegador: skip link, rota de cliente, proteção da rota admin, carrinho e checkout com campos de entrega/retirada e formas de pagamento.
- Corrigido o WhatsApp público para `+55 34 99900-3486`.

## Limite da avaliação WCAG

O contraste AAA foi verificado nos componentes com fundo sólido e tokens controlados. Textos incorporados nas imagens, gradientes e fotografias não podem ser certificados por cálculo de CSS; devem permanecer com texto HTML alternativo quando forem conteúdo e precisam de revisão visual com a arte final. A auditoria não substitui uma avaliação humana completa com NVDA/JAWS, VoiceOver, zoom de 200% e usuários reais.

## Migração Brasil Cloud

O procedimento operacional está em [BRASIL-CLOUD-MIGRATION.md](./BRASIL-CLOUD-MIGRATION.md). O código está preparado para Node.js 22, processo persistente, MySQL 8 e `PORT`, mas a hospedagem precisa fornecer as variáveis do `.env.example`, SSL, banco persistente e execução de migrations. O backup deve ser realizado antes da importação e o DNS deve preservar MX/SPF/DKIM/DMARC do e-mail.
