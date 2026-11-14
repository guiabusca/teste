# Guia Busca — guia local de negócios

> **Piloto em Iracemápolis?** Comece por [`PILOTO-IRACEMAPOLIS.md`](PILOTO-IRACEMAPOLIS.md): passo a passo para publicar, divulgar e medir.

Este pacote é um protótipo funcional de um guia de comércios e serviços de Iracemápolis-SP. A marca usada nesta versão é **Guia Busca**; confirme o registro no INPI antes de franquear. O nome pode ser trocado em `config.js` sem alterar a lógica do app.

## O que foi reformulado

A página pública agora começa pelo problema do morador: busca ampla, sugestões enquanto digita, atalhos de intenção, categorias com ícones, plantões e emergência. Os cards mostram status em tempo real, bairro, confiança e botões fixos de WhatsApp e ligação. A ficha da empresa abre em tela cheia no celular com galeria, endereço, rota, horários, redes, serviços, avaliações, compartilhamento e favoritos.

O painel `admin.html` foi redesenhado como uma central SaaS responsiva. Ele reúne visão geral, empresas, planos, cadastros, contatos, banners editáveis, novidades, plantões e configurações. O gerenciamento de fotos via GitHub continua disponível dentro do editor de empresa, com token mantido apenas em memória.

## Atualização: busca, navegação e publicação

- **Busca inteligente** (`SINONIMOS` em `config.js` + campo "Palavras de busca" no editor da empresa): "cabelo" acha salão, "remédio" acha farmácia, "cachorro" acha pet. Entende plural, acento e pequenos erros ("farmcia"). Quando não acha nada, sugere categorias e oferece "Minha empresa não está aqui".
- **Botão voltar funciona** (rotas `#buscar?q=…`, `#empresa/<id>`): cada empresa e cada busca tem link próprio, que pode ser compartilhado.
- **Perto de mim de verdade:** pede a localização, ordena pela distância (precisa de latitude/longitude da empresa, campos novos no editor) e mostra "a 1,2 km". Se a pessoa negar, mostra o filtro por bairro. A localização não sai do aparelho.
- **Ordem dos resultados:** relevância → abertas antes das fechadas → plano (Premium/Destaque) → ordem manual. O app avisa que Premium e Destaque são anunciantes.
- **Cadastro:** erros por campo, máscara de WhatsApp, caixa de aceite da Política de Privacidade (`privacidade.html`, modelo para revisão jurídica) e passo a passo "Como funciona".
- **Publicação:** `favicon.svg`, ícones, imagem de compartilhamento (`og-image.png`), `manifest.webmanifest`, `robots.txt`, `sitemap.xml`.

## Cadastrar várias empresas de uma vez (só com autorização)

**Regra do projeto: nenhuma empresa entra no guia sem pedir ou autorizar.** O caminho principal é o formulário do site ("Sua empresa no guia"). A importação serve para lançar de uma vez as empresas que já autorizaram (formulário, WhatsApp ou termo). O painel exige marcar a confirmação e guarda como e quando houve a autorização.

1. Painel → **Empresas → Importar planilha (CSV)** → "Baixar modelo". O arquivo `modelo-importacao-empresas.csv` também está na raiz do projeto.
2. Preencha uma empresa por linha no Excel ou Google Planilhas e salve como **CSV**. Obrigatórios: nome, categoria e telefone (ou WhatsApp).
   - Categoria: use as do guia (Comércio, Serviços, Saúde, Alimentação, Casa e obra, Beleza, Educação, Pets, Eventos). Palavras como "padaria", "farmácia", "salão" ou "eletricista" são convertidas sozinhas.
   - Horário: `8h às 18h`, `08:00-18:00`, `fechado` ou `24h`. Em branco = "Horário não informado".
   - Serviços e palavras de busca: separe com `;`.
   - Telefone fixo sem WhatsApp é aceito: o card mostra só o botão **Ligar**.
3. O painel mostra uma **prévia** (prontas, avisos, erros, já existentes) e só grava depois do seu clique. Dá para baixar as linhas com erro, corrigir e importar de novo. Até 500 por vez.
4. Todas entram como **Gratuito, sem fotos**, com o selo "Perfil em confirmação". Depois de confirmar o WhatsApp com a empresa, marque "Verificado" no editor.

## Divulgação e acompanhamento

- Link para o cadastro: `https://SEU-SITE/?origem=instagram#participar`. Troque `instagram` por `facebook`, `whatsapp`, `grupo-bairro`, `visita`, `qr-balcao`… O painel (Cadastros) mostra "via instagram" em cada pedido, e você descobre qual divulgação funciona.
- Link para o guia: `https://SEU-SITE/`. Link para uma empresa: `https://SEU-SITE/#empresa/<id>`.
- Na ficha de cada empresa ainda não verificada aparece **"Você é o responsável por esta empresa?"**: com `BRAND.whatsapp` preenchido, o botão abre o WhatsApp do guia com a mensagem pronta; sem ele, leva ao cadastro com o nome já preenchido. Há também "Informar erro ou pedir remoção" (WhatsApp ou `BRAND.email`).
- Reponda cada pedido de remoção rapidamente: reduz risco jurídico e irritação.

## Checklist antes de publicar

1. Em `config.js`: `BRAND.siteUrl`, `BRAND.whatsapp` (WhatsApp do guia) e `MODO_DEMO = false` (esconde o aviso de demonstração e liga os dados estruturados do Google).
2. Troque `https://guiabusca.com.br` pelo seu endereço real em `index.html` (tags `og:` e canonical), `robots.txt` e `sitemap.xml`.
3. Cole de novo `firestore.rules` nas regras do Firebase (aceita os campos `aceite` e `origem` no cadastro).
4. Troque empresas, telefones e fotos fictícios; preencha palavras de busca e latitude/longitude.
5. Complete `privacidade.html` (nome, CNPJ, e-mail) e peça revisão jurídica.
6. Crie Firebase e GitHub próprios; `ADMIN_AUTH_REQUIRED = true` para o painel.
7. Diagnóstico: abra `index.html?debug` para ver a origem dos dados no rodapé.

## Planos — escada de upgrade (Gratuito → Premium)

| Degrau | Preço ref. | O que a empresa GANHA ao subir |
|---|---|---|
| 1. **Gratuito** | R$ 0 | Nome, categoria, endereço, telefone, horário e 1 foto |
| 2. **Presença** | R$ 39 | Descrição e serviços, botão de WhatsApp, retirada/entrega/orçamento, até 3 fotos |
| 3. **Destaque** | R$ 79 | Prioridade nas listas, selo Verificado, métricas básicas de contatos, até 6 fotos |
| 4. **Premium** | R$ 149 | **Botões de Instagram e Facebook**, prioridade na home, banners e novidades, relatório avançado, até 10 fotos |

Tudo é definido em `config.js` (`PLANOS` + `FEATURES`). O app aplica sozinho: o **limite de fotos** e os **botões de Instagram/Facebook (só Premium)**. Os demais recursos são política comercial documentada na matriz do painel. Os preços são só referência; não existe cobrança automática.

## Novidades desta versão

- **Cadastro com plano:** o formulário público tem seletor de plano e um painel que mostra os benefícios do plano escolhido (e o que o próximo degrau oferece). O plano escolhido é gravado em `ira_cadastros.plano`.
- **Botões Instagram e Facebook (Premium):** aparecem na ficha da empresa em "Siga a empresa". Cliques são contabilizados (`instagram` / `facebook`) e aparecem na aba Contatos. Empresas de outros planos não exibem os botões, mesmo que tenham links salvos.
- **Aba "Planos e upgrade":** escada de upgrade, receita mensal estimada, planos vencidos, oportunidades de upgrade (empresas fora do Premium, por contatos) e matriz de recursos.
- **Aba "Mensagens prontas":** 12 textos de WhatsApp (3 por plano: boas-vindas, convite de upgrade, renovação) editáveis, com variáveis (`{nome}`, `{plano}`, `{preco}`, `{proximo}`, `{ganhos}`, `{validade}`…), prévia com dados de uma empresa real, botão Copiar e Abrir no WhatsApp. Também há o botão **Mensagem** nas abas Empresas e Cadastros.
- **Mensagem que o cliente envia à empresa:** o texto que já vem preenchido no WhatsApp quando o cliente toca em "WhatsApp" agora é por plano, com o nome da empresa (`{empresa}`, `{marca}`, `{cidade}`). Edite na aba Mensagens prontas.
- **Aprovar cadastro** agora abre o editor já preenchido (o plano começa como Gratuito; ative o plano pago depois de confirmar com a empresa). Ao escolher um plano pago, a validade é sugerida em 30 dias.
- **Mensagem de WhatsApp do app:** a mensagem definida em Configurações agora é realmente usada na página pública, e as configurações são gravadas também no Firestore.

## Regras do Firestore

Atualize as regras com o arquivo `firestore.rules`: ele passou a aceitar o campo `plano` nos cadastros, os tipos de clique `instagram` e `facebook`, e criou a coleção `ira_mensagens` (somente administrador).

## Acesso ao painel administrativo

O painel fica em `admin.html` e usa o Firebase Authentication. Ele não possui senha padrão nem cadastro público de administrador. Para testar sem senha, existe um botão **Entrar sem senha · modo local**, exibido somente quando o endereço for `localhost`, `127.0.0.1` ou `::1`. Nesse modo, o Firebase não autentica o acesso: os dados editados ficam no navegador e o botão nunca aparece em um domínio publicado. No Firebase Console do projeto configurado em `config.js`, abra **Authentication → Sign-in method**, ative **Email/Password** e depois abra **Users → Add user** para criar o e-mail e a senha que serão usados no painel.

Não abra `admin.html` por duplo clique (`file://`), porque os módulos JavaScript e o Firebase podem ser bloqueados pelo navegador. Rode `python3 -m http.server 8080` na pasta do projeto e acesse `http://localhost:8080/admin.html`.

Se aparecer “Usuário não encontrado”, o usuário ainda não foi criado no Authentication. Se aparecer “login por e-mail ainda não foi ativado”, ative o provedor Email/Password.

## Testar localmente

Na pasta que contém `index.html`:

```bash
python3 -m http.server 8080
```

Abra `http://localhost:8080`. O app tenta ler Firestore; se não conseguir, usa `data/negocios.json` e `data/conteudo.json`.

O painel depende do login do Firebase configurado no projeto provisório. As funções públicas de cadastro e contatos dependem das regras complementares em `firestore.rules`.

## Antes de produção

Crie um Firebase e um repositório GitHub próprios, substitua os valores de `config.js`, publique as regras com uma função `isAdmin()` segura, troque telefones/endereço/fotos fictícios e confirme os links sociais. A pasta `backup-before-redesign` preserva a versão anterior ao redesign.

## Ideias de nomes

Se o nome Guia Busca não puder ser registrado, boas alternativas são **Perto de Ira**, **Conecta Ira**, **Ira em Rede**, **Mapa da Cidade**, **Aqui em Ira**, **Vitrine Ira** e **Meu Comércio Ira**. Antes de decidir, confira domínio, redes sociais, facilidade de pronúncia e possibilidade de expansão para cidades próximas.

## Botão "Site" da empresa
- No painel, a empresa tem o campo **Site (link)**. O botão "Site" aparece na ficha a partir do plano **Presença** (Instagram e Facebook continuam no Premium). Para mudar, edite `features.site` em `config.js`.
- Na importação por CSV existe a coluna `site` (guardada sempre; só aparece quando o plano permitir).

## Pedido de participação → ficha completa
- O formulário "Para empresas" agora aceita dados opcionais (bairro, endereço, horário, o que oferece, descrição, telefone, site, Instagram) e o período do plano (mensal, 3 meses, 6 meses, 1 ano).
- No painel, em **Cadastros**, o botão **Criar ficha** abre a empresa já preenchida com esses dados. Ao salvar, o pedido vira "cadastrado".
- O plano pedido NÃO é ativado sozinho. Depois de confirmar o pagamento, clique em **Pagamento confirmado: ativar plano pedido**: o plano e a validade (hoje + meses contratados) são preenchidos e você salva.
- Descontos por período (5%, 10% e 15%) e o preço por dia (total ÷ dias) ficam em `config.js` (`PERIODOS`). Ajuste os percentuais como quiser.
- **IMPORTANTE:** cole de novo o arquivo `firestore.rules` nas regras do Firebase, porque o pedido ganhou campos novos. Sem isso o envio do formulário é recusado.

## Recursos por plano (versão atual)
- **Gratuito:** nome, categoria, endereço, telefone, **número de WhatsApp (só o número, sem botão)**, horário, 1 foto.
- **Presença:** + descrição e serviços, botão de WhatsApp, botão Instagram, retirada/entrega/orçamento, até 3 fotos.
- **Destaque:** + botão Facebook, prioridade nas listas, selo Verificado, métricas, até 6 fotos.
- **Premium:** + botão Site, prioridade na home, banners e novidades, relatório avançado, até 10 fotos.
Tudo isso é controlado em `config.js` (`PLANOS` e `features`).

## Publicação dos dados: lista estática (custo zero de leitura)

**O que mudou.** Antes, cada visita lia todas as empresas do Firestore (500 empresas = 500 leituras por visita; a cota gratuita é de 50.000 leituras por dia). Agora o site público lê dois arquivos prontos, `data/negocios.json` e `data/conteudo.json`, e **não faz nenhuma leitura no Firestore**. O Firestore continua sendo usado para: login e edição no painel, pedidos de cadastro e registro de cliques.

**Como publicar depois de editar no painel** (as edições ficam no Firestore até serem publicadas):

1. **Automático.** O arquivo `.github/workflows/publicar-dados.yml` roda uma vez por dia, copia o Firestore para `data/` e faz o commit só se algo mudou. Para publicar na hora: GitHub → aba **Actions** → "Publicar dados do guia" → **Run workflow**.
2. **Manual.** Painel → **Configurações → Publicar lista no site** → baixe `negocios.json` e `conteudo.json`, coloque na pasta `data/` e faça o commit.
3. **Pelo computador.** `node scripts/exportar-dados.mjs` (Node 22.7 ou mais novo). Não precisa de senha: as regras já deixam essas coleções públicas para leitura.

**Proteções.** O script recusa gravar se o Firestore voltar sem nenhuma empresa ativa (evita esvaziar o guia por falha de rede ou de regras; use `--forcar` se for de propósito). Empresas desativadas não entram no arquivo público.

**Conferir o que está no banco.** Abra `index.html?live`: força a leitura direta do Firestore (use só para conferência, porque gasta leituras). O rodapé de `?debug` mostra a fonte dos dados em uso.

**Atenção.** O que já está em `data/negocios.json` hoje são os dados de demonstração. Depois do primeiro cadastro real no painel, rode a publicação; os arquivos de demonstração serão substituídos pelo conteúdo do Firestore. Banners, novidades e plantões também vêm do Firestore: o que só existir no `conteudo.json` de demonstração será substituído.

**Se o site ficar no Cloudflare Pages:** o commit do robô dispara a publicação sozinho. O plano gratuito permite 500 publicações por mês e 20.000 arquivos por site. Cada commit (inclusive o do robô e o de cada envio de fotos) gera uma publicação, e fotos no repositório contam como arquivos: por isso a migração das fotos para o R2 é o próximo passo antes de crescer.


## Tipo de negócio, CNPJ opcional e selos (fase 1)
- **Formulário público:** campo "Tipo de negócio" (Tenho CNPJ / Sou MEI / Sou autônomo / Ainda não tenho CNPJ) e CNPJ opcional, validado pelo dígito verificador. CPF nunca é pedido.
- **Selos no guia:** "MEI" e "Autônomo" seguem o que a pessoa declarou. "CNPJ conferido" só aparece depois que você marca a caixa no editor da empresa (painel) e só então o número do CNPJ fica público.
- **Como conferir:** consulte a situação cadastral do CNPJ no site da Receita Federal e marque "CNPJ conferido". A data fica gravada.
- **Página "Formalize seu negócio":** `#formalizar` (link no rodapé e no formulário). Revise os valores do DAS e o limite do MEI todo início de ano.
- **Importação CSV:** coluna opcional `tipo_negocio` (mei, autonomo, cnpj, naotem). O modelo foi corrigido (a coluna "site" estava faltando nos exemplos).
- **Regras do Firestore:** publique o `firestore.rules` novamente (aceita `tipoNegocio` e `cnpj` em `ira_cadastros`). Sem isso, cadastros com esses campos serão recusados.
- **Para depois:** verificação de WhatsApp e filtro "Emite nota fiscal".

## Busca rápida (celular) × Versão completa
- No celular o guia abre em **Busca rápida**: busca no topo, "Aberto agora" em círculos, categorias e lista com WhatsApp / Ligar / Rota. O seletor "Busca rápida | Versão completa" fica no topo e a escolha é lembrada no aparelho.
- No computador (telas acima de 720 px) é sempre a versão completa, sem seletor.
- Para abrir o celular na versão completa por padrão, troque `'rapido'` por `'completo'` em `store.get('modo', 'rapido')` no `index.html`.
- Na busca rápida também ficam visíveis os atalhos **Perto de mim**, **Delivery**, **Emergência 24h** e **Entrega grátis**, e o filtro por **bairro**. Com "Perto de mim" ativo, cada empresa mostra a distância e o tempo estimado a pé (até 1,5 km) ou de bicicleta.
