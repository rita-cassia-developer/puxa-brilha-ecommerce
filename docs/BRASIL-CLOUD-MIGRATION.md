# Migração do Puxa & Brilha para a Brasil Cloud

Este projeto roda com Node.js 22, Express, React/Vite, tRPC, Drizzle ORM e MySQL 8. A migração deve ser feita em uma janela controlada, preservando o banco original até a validação final.

## 1. Pré-requisitos na hospedagem

- Node.js 22.x.
- MySQL 8.x com banco UTF-8 (`utf8mb4`), usuário próprio e permissões apenas no banco da aplicação.
- Variáveis de ambiente configuradas no painel da Brasil Cloud; não envie `.env` por FTP nem o commite no Git.
- Domínio apontado para a aplicação somente depois de o endereço temporário responder em `/api/health`.
- HTTPS/SSL ativo antes de habilitar login e cookies em produção.

## 2. Variáveis obrigatórias

Copie os nomes de [.env.example](../.env.example) para o painel da hospedagem e preencha os valores reais. `DATABASE_URL` e `MANUS_JWT_SECRET` são secretos. `MANUS_API_KEY` também é secreto. `MANUS_API_BROWSER_KEY` só deve ser usada se a integração do navegador realmente precisar dela.

Use uma senha de banco longa e exclusiva. Não reutilize a senha da hospedagem, do Registro.br ou do e-mail.

## 3. Backup e importação do MySQL

No ambiente atual, gere um backup consistente:

```bash
mysqldump --single-transaction --routines --triggers --default-character-set=utf8mb4 \
  -h HOST_ORIGEM -u USUARIO_ORIGEM -p NOME_DO_BANCO > puxa-brilha-backup.sql
```

Na Brasil Cloud, crie o banco vazio e importe:

```bash
mysql --default-character-set=utf8mb4 \
  -h HOST_DESTINO -u USUARIO_DESTINO -p NOME_DO_BANCO < puxa-brilha-backup.sql
```

Confira antes e depois da importação:

```sql
SHOW TABLES;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM products;
SELECT COUNT(*) FROM orders;
SELECT COUNT(*) FROM vendors;
SELECT COUNT(*) FROM commissions;
```

Nunca rode testes destrutivos contra o banco de produção. O banco gerenciado do projeto é compartilhado entre desenvolvimento, teste e publicação.

## 4. Build e execução

```bash
corepack enable
corepack prepare pnpm@10.18.0 --activate
pnpm install --frozen-lockfile
pnpm check
pnpm build
pnpm db:migrate
pnpm start
```

A aplicação escuta `PORT` e deve ficar acessível em `0.0.0.0`. O health check é:

```bash
curl -fsS https://SEU_DOMINIO/api/health
```

Resposta esperada: `{"status":"ok"}`.

O comando `pnpm db:migrate` deve ser executado somente após o backup e contra o banco de destino. Não use `db:push` em produção sem revisar o SQL gerado.

## 5. Validações antes de trocar o domínio

1. Abrir a vitrine e conferir imagens, categorias, carrinho e checkout.
2. Criar um pedido de teste com retirada e outro com entrega/frete.
3. Confirmar no banco que o pedido e os itens foram gravados.
4. Conferir a baixa de estoque e o estorno de estoque ao cancelar/excluir pelo admin.
5. Testar login de cliente, admin e parceiro com contas reais de teste.
6. Testar um link de indicação e conferir visita, lead e comissão.
7. Confirmar que `/api/health`, `/manus-routes.json` e os assets respondem com HTTP 200.
8. Validar HTTPS, redirecionamento seguro e recebimento do e-mail profissional separadamente da aplicação.

## 6. DNS e e-mail

Aponte apenas os registros necessários para o site. Preserve os registros MX, SPF, DKIM e DMARC do provedor de e-mail da cliente. Não substitua a zona DNS inteira por uma configuração da hospedagem sem exportar os registros atuais.

## 7. Operação e backup

- Faça backup do banco antes de cada migração ou alteração estrutural.
- Mantenha ao menos uma cópia fora da hospedagem.
- Guarde as credenciais em um gerenciador de senhas.
- Rotacione `MANUS_JWT_SECRET` somente com planejamento, pois isso invalida sessões existentes.
- Ative logs e monitore `/api/health` após publicar.
- Não exponha o painel administrativo no menu público; o acesso continua protegido por autenticação e autorização no servidor.

## Limite importante

A compatibilidade do código não substitui a confirmação comercial da Brasil Cloud sobre o plano contratado. Antes de pagar, confirme por escrito Node.js 22, processo persistente para `pnpm start`, variáveis de ambiente, MySQL 8, SSL, acesso ao domínio e possibilidade de executar migrations. Se o plano oferecer apenas hospedagem PHP/estática, ele não atende este projeto sem mudar a arquitetura.
