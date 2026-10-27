# Pesquisa de hospedagem — Puxa e Brilha

Data da pesquisa: 27/10/2026

## Requisitos do projeto

A aplicação usa React/Vite no frontend, Node.js/Express/tRPC no backend, Drizzle ORM e MySQL. Também precisa de domínio próprio, HTTPS/SSL, variáveis de ambiente, execução persistente do servidor e banco de dados com backup.

## Hostinger

A documentação oficial informa que os planos Business/Unlimited e Cloud suportam aplicações Node.js com React, Vite e Express, incluindo deploy por GitHub ou ZIP. A Hostinger informa que o Node.js pode ser usado nos planos Business/Unlimited, Cloud Startup, Cloud Professional, Cloud Enterprise e Cloud Enterprise Plus.

Fonte: https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/

A página brasileira de hospedagem Node.js mostra o plano Unlimited a partir de R$ 12,99/mês em oferta, com cobrança contratual antecipada e renovação informada na própria página, e o Cloud Startup a partir de R$ 39,99/mês em oferta. Os preços são promocionais e podem mudar.

Fonte: https://www.hostinger.com/br/nodejs-hosting

A Hostinger oferece MySQL nos planos de hospedagem e documenta o uso da variável DATABASE_URL com formato mysql://. O banco pode ser criado no painel e a aplicação deve ser reiniciada após configurar as variáveis.

Fonte: https://www.hostinger.com/support/connecting-a-hostinger-mysql-database-to-a-node-js-application/

A documentação também informa limites relevantes: cada aplicação Node.js roda como um processo, há limite de 120 segundos por requisição, não há WebSockets de entrada, não há workers sempre ativos e não é possível executar Docker, Redis ou serviços extras nos planos web/cloud. Para este e-commerce, isso não bloqueia o fluxo atual, pois ele usa HTTP/tRPC e MySQL, sem WebSocket ou worker permanente.

Fonte: https://www.hostinger.com/support/hostinger-node-js-limits-for-web-and-cloud-plans/

## HostGator

A documentação oficial da HostGator informa que Node.js é incompatível nos planos compartilhados e compatível em servidores VPS e dedicados. A mesma tabela informa que MySQL é compatível nos planos VPS/dedicado; nos compartilhados, a compatibilidade depende da versão/servidor.

Fonte: https://suporte.hostgator.com.br/hc/pt-br/articles/30811116692115-Quais-s%C3%A3o-as-compatibilidades-da-HostGator

A HostGator oferece VPS Linux no Brasil com controle para configurar Node.js e MySQL, mas isso exige configuração e manutenção do servidor, SSL, processo Node, firewall, backups e atualizações.

Fonte: https://www.hostgator.com.br/servidor-vps

## Railway

O Railway oferece serviço Node.js por deploy de projeto e template MySQL. A documentação informa que o MySQL pode ser provisionado com zero configuração e fornece MYSQL_URL, MYSQLHOST, MYSQLPORT, MYSQLUSER, MYSQLPASSWORD e MYSQLDATABASE. Também oferece backups e recuperação pontual como recursos configuráveis.

Fonte: https://docs.railway.com/databases/mysql

O Railway suporta domínio próprio, HTTPS automático e configuração por DNS. É tecnicamente compatível com o projeto, mas usa cobrança baseada em recursos/uso, então é menos previsível para quem está começando.

Fonte: https://docs.railway.com/networking/public-networking

## Render

O Render suporta serviços Node.js, domínios próprios e TLS automático. Porém, o banco gerenciado documentado como nativo é PostgreSQL, enquanto o projeto atual usa MySQL. Para usar Render seria necessário manter um MySQL externo ou alterar o banco da aplicação, portanto não é a opção mais simples para este projeto.

Fonte: https://render.com/pricing
Fonte: https://render.com/docs/databases

## Conclusão técnica

A opção mais simples para este projeto é Hostinger com plano que ofereça Node.js gerenciado e MySQL, preferencialmente Cloud Startup se o orçamento permitir. O plano Business/Unlimited também suporta Node.js, mas deve ser confirmado no painel durante a contratação e comparado pelos limites de processo e banco.

HostGator só deve ser escolhida com VPS. Não contratar plano compartilhado básico para esta aplicação.

Railway é uma alternativa técnica válida e mais próxima de uma plataforma de deploy, mas exige atenção à cobrança variável e à configuração do domínio.

Render não é recomendado sem alterar a estratégia de banco, porque o projeto está preparado para MySQL e a documentação do serviço gerenciado destaca PostgreSQL.
