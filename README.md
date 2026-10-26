# DropVertical

Site da Drop Vertical, Escola de Surf no Posto 6 da Barra da Tijuca, Rio de Janeiro.

## Publicação no GitHub Pages

Os arquivos completos do site ficam em `docs/`, incluindo HTML, estilos, scripts e todas as imagens locais. Não depende do site anterior para carregar fotos ou conteúdo.

No repositório, abra **Settings → Pages** e selecione:

- Source: **Deploy from a branch**
- Branch: **main**
- Folder: **/docs**
- Clique em **Save**

Endereço esperado depois de habilitar e concluir a publicação:

https://dropverticalrj.com.br/

O domínio próprio está configurado em `docs/CNAME`. O build lê esse arquivo automaticamente e publica os caminhos na raiz (`/assets/...`, `/en/`, `/es/`), sem o prefixo `/DropVertical/`. Se o domínio mudar, atualize o CNAME antes de reconstruir. Uma variável `PAGES_URL` incompatível com esse domínio causa erro de build para evitar repetir a quebra de CSS e imagens.

A ativação do Pages depende das configurações administrativas do repositório. A presença dos arquivos não comprova que o Pages já esteja ativo.

## SEO antes do domínio definitivo

Esta versão mantém `noindex,follow` para revisão, conforme a preparação anterior de SEO. Os endereços canonical/hreflang e o sitemap usam o domínio próprio definido no CNAME. A indexação deve ser liberada em uma etapa separada, quando o proprietário confirmar os dados comerciais.

O `robots.txt` de um site de projeto fica em `/DropVertical/robots.txt`, mas os mecanismos de busca procuram o arquivo na raiz do domínio. No GitHub Pages de projeto, não é possível controlar o robots global de `maximilerlima.github.io` por este repositório. A diretiva `noindex` é entregue no HTML de cada página.

GitHub Pages não aplica `_headers`, `_redirects` ou `.htaccess`. Não usamos esses arquivos como promessa de cache, cabeçalhos ou redirecionamentos. A página `404.html` oferece retorno aos três idiomas.

O `CNAME` adicionado pelo proprietário é preservado pelo build.

## Atualização do site

Requisitos: Node.js 22 ou superior, npm e ImageMagick (`convert` e `identify`).

```sh
npm ci
npm run build:pages
npm test
npm run test:pages
```

Edite a home aprovada em `src/home-template.html`, o conteúdo complementar em `src/seo-content.mjs` e as configurações em `config/site.mjs`. O build gera `dist/` e exporta a versão para GitHub Pages em `docs/`. Depois de editar, envie também as mudanças de `docs/` para a branch `main`.

Os arquivos WebP em `dist/assets/` fazem parte da fonte do site e são necessários para reconstrução. As imagens originais usadas na página foram preservadas visualmente, sem gerar novos retratos do Daniel. A exportação inclui versões otimizadas, não arquivos antigos de apresentações ou backups do Sites.

Para outra URL ou domínio confirmado, informe `PAGES_URL` no build. Para liberar indexação, informe também `SITE_ENV=production`. Não use produção enquanto a URL e os dados comerciais não estiverem confirmados.

As integrações `GA4_ID`, `GOOGLE_SITE_VERIFICATION` e `BING_SITE_VERIFICATION` são opcionais e exigem IDs/tokens reais. Sem GA4 configurado, a biblioteca de Analytics não carrega. Quando configurado, exige consentimento.

## Documentação

- `SEO.md`: relatório da implementação de SEO anterior à migração. As referências ao domínio antigo documentam o estado daquela entrega, não as URLs da exportação atual.
- `reports/github-pages.json`: destino e ambiente da exportação atual.
- `tests/seo.test.mjs` e `tests/pages.test.mjs`: validações automatizadas.

Instruções oficiais para ativar a publicação: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
