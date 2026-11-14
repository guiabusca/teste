# Piloto em Iracemápolis — passo a passo

Objetivo: em 30 dias descobrir se uma cidade pequena (cerca de 22 mil habitantes) usa o guia e se os donos de empresa querem estar nele. Tudo roda de graça nesta fase.

## 1. Preencher antes de publicar (5 minutos)

Abra `config.js` e preencha os campos marcados com **PREENCHER**:

| Campo | O que colocar |
| --- | --- |
| `BRAND.whatsapp` | WhatsApp do guia, só números com DDD e 55 (ex.: `5519999999999`). É para onde vão os avisos de cadastro e as buscas sem resultado. |
| `BRAND.email` | E-mail de contato. |
| `BRAND.operador` / `BRAND.cnpj` | Seu nome ou razão social e CNPJ (se tiver). Aparecem na Política de Privacidade. |
| `BRAND.siteUrl` | O endereço real do site. Já deixei `https://guiabusca.github.io/guiabusca` em todos os arquivos (config, prévia do link no WhatsApp, Google). Se o seu endereço for outro, rode `node scripts/definir-endereco.mjs https://SEU-ENDERECO` ou me diga qual é que eu ajusto: sem isso, a prévia do link no WhatsApp fica sem imagem. |
| `PILOTO.inicio` | A data da divulgação (AAAA-MM-DD). As metas do painel contam a partir dela. |

## 2. Publicar as regras do Firebase

Firebase → Firestore Database → **Regras** → apague tudo, cole o conteúdo de `firestore.rules` → **Publicar**. Elas incluem duas coleções novas (visitas e buscas). Se a tela apontar erro de sintaxe, me mande a mensagem.

Se o painel não deixar você entrar no endereço do GitHub: Firebase → Authentication → Settings → **Authorized domains** → adicione `guiabusca.github.io`.

## 3. Enviar os arquivos para o GitHub

No repositório: **Add file → Upload files**, arraste o **conteúdo** da pasta (não a pasta inteira), escreva uma mensagem e clique **Commit changes**. Em 1 a 2 minutos o site atualiza. Depois apague pelo próprio GitHub os arquivos antigos que sobraram: `admin (7).html` e `firestore.rules.ira-ADICIONAR.txt`.

## 4. Limpar o que for demonstração

No painel (`admin.html`), aba **Empresas**: apague qualquer empresa de exemplo que esteja no Firestore. O site novo já nasce sem dados fictícios e, enquanto não houver empresas, mostra "Estamos montando o guia de Iracemápolis".

## 5. Cadastrar as primeiras empresas ANTES de divulgar

Divulgar um guia vazio gasta a primeira impressão. Meta: **40 a 60 empresas** no ar. Cadastre só com autorização do dono (peça no WhatsApp ou pessoalmente). Duas formas:
- uma a uma: painel → **Nova empresa**;
- em lote: preencha `modelo-importacao-empresas.csv` e importe no painel.

Comece pelo que o morador mais procura: farmácia, mercado, marmita/lanche, salão/barbearia, mecânico, eletricista/encanador, pet shop, material de construção, clínica/dentista.

## 6. Fotos

No painel, ao editar uma empresa, cole um **token do GitHub** e publique as fotos. Crie o token em GitHub → Settings → Developer settings → Fine-grained tokens, só para este repositório, com permissão **Contents: Read and write** e validade de 90 dias. O token nunca é salvo: vale só até fechar a aba.
Capacidade: cada empresa ocupa cerca de 160 KB por foto de 1.200 px; 100 empresas com 5 fotos dão ~80 MB, muito abaixo do limite de 1 GB do GitHub Pages.

## 7. Divulgar com links rastreáveis

Use um link diferente por canal; o painel mostra de onde vieram as visitas:

- Instagram: `SEU-SITE/?origem=instagram`
- Grupos de WhatsApp: `SEU-SITE/?origem=whatsapp`
- Panfleto/QR Code: `SEU-SITE/?origem=panfleto`
- Visita presencial: `SEU-SITE/?origem=visita`

## 8. Ler os resultados (painel → Visão geral → Resultados do piloto)

- **Procuraram e não acharam:** a lista de empresas que você deve cadastrar primeiro.
- **Cliques no WhatsApp:** mostra se o guia gera contato, que é o que o dono de empresa compra.
- **De onde vêm as visitas:** diz onde investir tempo.

Metas sugeridas para 30 dias (ajuste em `PILOTO.metas`): 60 empresas, 1.500 visitas, 300 cliques no WhatsApp, 30 pedidos de cadastro. Como regra de decisão sugerida: se atingir pelo menos metade das metas e 5 donos aceitarem pagar por um plano, vale ir para a segunda cidade; abaixo disso, ajuste a oferta antes de gastar mais.

## 9. Limites e quando mudar

- O site lê o Firestore a cada visita (`MODO_DADOS = "ao-vivo"`). Limite gratuito: 50.000 leituras por dia. Conta: visitas por dia × empresas. Com 60 empresas, cabem cerca de 800 visitas por dia. Passando de ~40.000 leituras, troque para `"estatico"` em `config.js` (e publique a lista pelo painel).
- Se o limite acabar, o site usa sozinho `data/negocios.json` como reserva (atualizada 1 vez por dia pela automação do GitHub, que você ativa na aba Actions).
- **Quando começar a cobrar planos**, migre a hospedagem para o Cloudflare Pages: os termos do GitHub Pages não permitem uso comercial. No piloto gratuito não é necessário.
