# Backup e migração do banco Puxa e Brilha

O projeto usa MySQL. Antes de trocar de hospedagem, configure `DATABASE_URL` no ambiente atual e execute:

```bash
pnpm db:backup
```

O comando cria um arquivo SQL em `backups/` com estrutura, dados, índices, rotinas e triggers. A pasta é ignorada pelo Git para não enviar dados da loja ao repositório.

Para restaurar em outro MySQL:

```bash
mysql -h NOVO_HOST -P 3306 -u NOVO_USUARIO -p NOVO_BANCO < backups/puxa-e-brilha-AAAA-MM-DDTHH-MM-SS-sssZ.sql
```

Depois, atualize a `DATABASE_URL` da nova aplicação e valide produtos, pedidos, vendedores, leads e comissões antes de apontar o domínio. Mantenha o backup original até a conferência final.
