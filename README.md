# Grimorio Magic

Aplicacao educativa em Angular para explorar cartas, colecoes, cores, regras e decks de Magic: The Gathering usando a API gratuita do projeto Magic: The Gathering API.

## Objetivo

- Pesquisar cartas por nome, cor de mana e tipo.
- Evitar repeticao na listagem principal mostrando nomes unicos.
- Abrir uma carta para ver detalhes, printings, regras, legalidades e outras estampas disponiveis.
- Favoritar uma versao especifica da carta.
- Montar decks de 30 ou 60 cartas com limite de 4 copias por carta que nao seja terreno basico.
- Salvar favoritos e decks em cookies do navegador.
- Apresentar secoes educativas com regras essenciais, colecoes recentes e lore de planeswalkers famosos.

## API usada

Base URL:

```txt
https://api.magicthegathering.io/v1
```

Endpoints planejados/usados:

- `GET /cards`: busca, filtros, paginacao e imagens quando disponiveis.
- `GET /cards/:id`: detalhe por id ou multiverseid, se necessario em proximas telas.
- `GET /sets`: colecoes e edicoes.
- `GET /types`, `/subtypes`, `/supertypes`: taxonomia de cartas.
- `GET /formats`: formatos de jogo.

A API nao exige token. O limite documentado e de 5000 requisicoes por hora e cada pagina de cartas retorna no maximo 100 itens.

## Ambiente

Requisitos:

- Node.js 24+
- npm 11+
- Git
- VS Code

## Instalacao em outro PC

1. Clone o repositorio:

```bash
git clone <url-do-repositorio>
```

2. Entre na pasta do projeto:

```bash
cd Magic-API
```

3. Abra no VS Code:

```bash
code .
```

4. Instale as dependencias:

```bash
npm install
```

5. Rode o servidor local:

```bash
npm start
```

6. Abra no navegador:

```txt
http://127.0.0.1:4200
```

O `npm start` usa `proxy.conf.json` para encaminhar `/mtg-api` para `https://api.magicthegathering.io/v1`. Isso evita bloqueios de CORS no navegador durante o desenvolvimento local.

Observacao: alguns filtros combinados da API oficial retornam `500`, como `types` junto de `colorIdentity` ou `orderBy` em certas buscas. O app contorna isso buscando por um filtro mais estavel e refinando cor/ordem no cliente.

Para gerar a versao de build:

```bash
npm run build
```

Se trocar de computador e algo nao abrir, apague `node_modules` e rode `npm install` de novo. A pasta `node_modules` nao deve ser commitada.

## Variaveis de ambiente

Nao ha segredo obrigatorio para esta API. O arquivo `.env.example` documenta a base usada:

```txt
MTG_API_BASE_URL=https://api.magicthegathering.io/v1
```

Em Angular, o valor efetivo esta em:

- `src/environments/environment.ts`
- `src/environments/environment.prod.ts`

## Estrutura

```txt
public/assets/       imagens e texturas colocadas manualmente
public/assets/mana/  logos White.webp, Water.webp, Black.webp, Red.webp, Green.webp, Colorless.webp
src/app/
  data/              conteudo educativo estatico
  models/            tipos TypeScript da API e do app
  services/          consumo da API e persistencia em cookies
  app.component.*    tela principal e componentes visuais da primeira versao
```

## Fontes

- Documentacao da Magic: The Gathering API: https://docs.magicthegathering.io/
- API base: https://api.magicthegathering.io/v1
