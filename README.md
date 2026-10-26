# Puxa e Brilha — Cosméticos Essenciais

React / Express / tRPC / Drizzle starter, adapted from the Sandbox web-db-user template.

- `pnpm dev`: development server; honors `PORT` (default 3000).
- `pnpm build` / `pnpm start`: build and serve `dist/index.js` and `dist/public/`.
- `pnpm db:migrate`: apply checked-in migrations. `pnpm db:push`: generate and apply new schema changes.
- `pnpm check` / `pnpm test`: types and application tests.

Start with the Webdev skill's default-template guide. Platform login, storage, payments and service contracts live in its shared references; read the relevant capability before extending its helper.

`server/_core/publicConfig.ts` exposes only named public runtime values. Private keys stay server-side. The platform serves managed `/manus-storage/` assets; the application does not register a second proxy.

Platform configuration is readable and editable through `webdev.config`. Default settings are initial values, not enforced constraints. The agent may modify the files, commands and configuration or follow the flexible guide for another stack.

## Estado atual do catálogo
O site está preparado para ser finalizado antes da fabricação dos produtos. O catálogo público pode ficar vazio até a proprietária enviar as fotos e definir os preços. O painel administrativo continua disponível para cadastrar os produtos reais depois.

## Perfis comerciais
O cadastro administrativo aceita três perfis de parceiros: Representante, Vendedor e Distribuidor. Cada parceiro pode ter comissão, link de indicação, leads e vendas associadas.
