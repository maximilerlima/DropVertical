# Relatório de implementação SEO: Drop Vertical

## 1. Auditoria e alterações

**Testado / Implementado.** O site original já estava publicado no Sites, embora o briefing o descrevesse como ainda não publicado. A origem existente é `https://drop-vertical.maximilerlima.chatgpt.site`. O projeto usa HTML estático com CSS e JavaScript inline. Não é React e não precisou de SSR, migração de framework ou pré-renderização de uma aplicação CSR.

Os idiomas inglês e espanhol antes dependiam de uma troca de texto em JavaScript, sem URLs independentes. O HTML inicial continha só português. Não havia canonical, hreflang, sitemap, dados estruturados ou páginas de serviço independentes.

Implementamos geração estática, arquivos compartilhados de CSS/JS, links rastreáveis de idioma, metadados e páginas complementares. A home aprovada mantém a ordem das seções, os textos principais e as fotografias reais do Daniel. A codificação WebP preserva os enquadramentos e não gera novas pessoas.

## 2. Arquivos

**Implementado.** Fontes adicionadas:

- `config/site.mjs`: origem, ambiente, integrações e dados comerciais centrais.
- `src/home-template.html`: cópia preservada da home aprovada, incluindo as traduções existentes.
- `src/seo-content.mjs`: rotas, metadados e conteúdo complementar em três idiomas.
- `src/enhancements.js`: preferências, conversões e consentimento.
- `scripts/build.mjs`: geração dos documentos, sitemap, cabeçalhos e imagens responsivas.
- `tests/seo.test.mjs`: testes de estrutura, links, idiomas e WhatsApp.
- `package.json`, `package-lock.json`, `.gitignore` e `README.md`.

Saídas adicionadas/alteradas: `dist/index.html`, `dist/en/`, `dist/es/`, diretórios de páginas de serviço/escola/privacidade, `dist/404.html`, `dist/sitemap.xml`, `dist/robots.txt`, `dist/_headers`, `dist/_redirects`, `dist/assets/site.css`, `dist/assets/site.js`, variantes WebP e `reports/routes.json`. Os originais das imagens e arquivos anteriores do projeto foram preservados.

## 3. Páginas otimizadas

**Implementado / Testado.** 21 documentos localizados, além de 404:

| Conteúdo | Português | Inglês | Espanhol |
| --- | --- | --- | --- |
| Home | `/` | `/en/` | `/es/` |
| Surf | `/aulas-de-surf/` | `/en/surf-lessons/` | `/es/clases-de-surf/` |
| Stand up | `/aulas-de-stand-up/` | `/en/stand-up-paddle-lessons/` | `/es/clases-de-paddle-surf/` |
| Kitesurf | `/aulas-de-kitesurf/` | `/en/kitesurf-lessons/` | `/es/clases-de-kitesurf/` |
| Aluguel | `/aluguel-de-equipamentos/` | `/en/equipment-rental/` | `/es/alquiler-de-equipos/` |
| Escola | `/a-escola/` | `/en/about-us/` | `/es/la-escuela/` |
| Privacidade | `/privacidade/` | `/en/privacy/` | `/es/privacidad/` |

## 4. Idiomas e conversão

**Implementado / Testado.** HTML inicial completo em PT-BR, EN e ES, sem depender de clique nas bandeiras para renderizar o idioma. Bandeiras usam links reais para a página equivalente e oferecem retorno ao português no desktop e no cabeçalho/menu mobile.

Navegação, modal, textos alternativos, rótulos de acessibilidade, estados iniciais e mensagens do WhatsApp estão localizados. A preferência permanece durante a navegação e no armazenamento local. Uma URL explícita sempre prevalece, sem redirecionamento por IP ou pelo idioma do navegador.

Os cards de serviços agora levam às páginas correspondentes. Cards de formato de aula abrem o modal com o nível pré-selecionado. CTAs de páginas internas pré-selecionam a modalidade. Sem JavaScript, os CTAs ainda levam ao WhatsApp com mensagem contextual. Os participantes mantêm valores numéricos em todos os idiomas.

**Pendente.** Reconfirmação do WhatsApp comercial pelo proprietário, apesar de termos preservado exatamente o número usado no site anterior. Confirmar com a escola o atendimento efetivo nos três idiomas e detalhes comerciais antes do lançamento definitivo.

## 5. Metadados

**Implementado / Testado.** Title e meta description exclusivos em cada documento, um H1 por página, `lang`, canonical individual absoluto, hreflang recíproco com `pt-BR`, `en`, `es` e `x-default`, Open Graph e cartão social. Sitemap inclui as 21 URLs e alternâncias de idioma.

**Implementado / Testado por HTTP.** Configuração central de origem e ambiente. O modo padrão é preview, com `noindex,follow` no HTML, sem anunciar sitemap no robots. A URL real do Sites serve como origem provisória das canonicals. Ao configurar o domínio definitivo, o build atualiza todas as URLs de uma vez.

## 6. Dados estruturados

**Implementado / Testado.** JSON-LD com `LocalBusiness`, `WebSite`, `WebPage`, quatro tipos de `Service` e `BreadcrumbList` nas páginas internas. IDs da empresa e do website permanecem consistentes. Não duplicamos a empresa com uma segunda entidade Organization desnecessária.

**Pendente.** Endereço postal completo, marcador oficial do Maps e horários confirmados. Sem esses dados, o perfil estruturado é deliberadamente parcial e não promete elegibilidade para resultados enriquecidos. Não há `AggregateRating`, avaliações inventadas, coordenadas meteorológicas promovidas a endereço, preços ou certificações.

## 7. Testes e performance

**Testado.** 12 cenários automatizados: quantidade de páginas, títulos/descrições únicos, H1, indexabilidade por ambiente, canonicals, hreflang, links e assets locais, fragmentos, preservação de copy/ordem da home, imagens, JSON-LD, bandeiras nos dois menus, sitemap, parse do JavaScript, privacidade e envio do formulário nos três idiomas.

Os 12 cenários passaram tanto no build de produção quanto no build de preview. Depois do teste, restauramos o build de preview para a publicação de revisão. Testes HTTP na URL publicada confirmaram as 21 páginas com status 200, atributo `lang` correto e `noindex` no HTML. Uma URL inexistente retornou 404.

O teste do formulário usa DOM simulado e comprova montagem da mensagem e URL. Ele não representa teste visual, envio real de mensagem ou confirmação de reserva.

**Implementado.** Hero WebP de 131.676 bytes no desktop e 54.158 bytes na variante mobile, contra 2.242.550 bytes do PNG anterior. Redução aproximada de 94% e 98%, respectivamente, somente para esse arquivo. Daniel 1 passou de 670.062 para 34.554 bytes na cópia WebP. Variantes de cards têm 480 e 960 pixels, `srcset`, `sizes`, dimensões explícitas, lazy loading e decoding assíncrono. Hero possui preload seletivo. CSS/JS compartilhados têm versão de cache. Motion e parallax existentes foram preservados, com fallback sem JavaScript e suporte a movimento reduzido.

**Não suportado nesta execução.** Revisão visual automatizada de navegador: o controlador exigido pelo ambiente não estava disponível. Não instalamos outro navegador nem iniciamos servidor de preview por fora do fluxo suportado.

**Não suportado pela publicação estática observada.** Os arquivos de portabilidade `_headers` e `_redirects` não foram aplicados pelo Sites nesta publicação. Não observamos `X-Robots-Tag` e `/pt/` retornou 404, sem o redirecionamento preparado. Nenhum link depende desse alias. O `noindex` funciona pelo HTML, confirmado nas 21 páginas. A plataforma entregou cache com revalidação, em vez do cabeçalho de cache personalizado. Configurar essas regras na hospedagem definitiva e testar novamente. Não declaramos os cabeçalhos HTTP personalizados como implementados em produção.

**Pendente.** LCP, INP e CLS de campo e notas reais do PageSpeed. Não medimos nem inventamos essas notas. A redução de bytes não prova, sozinha, que as metas de Core Web Vitals foram atingidas.

## 8. Dependências do domínio

**Pendente.** Informar e conectar domínio, validar HTTPS/DNS, configurar `SITE_URL` e `SITE_ENV=production`, regenerar, executar testes e republicar. Configurar redirecionamento permanente da origem antiga quando aplicável. A versão provisória deve continuar sem indexação até essa decisão.

**Pendente.** Verificação real no Search Console, GA4 e Bing Webmaster Tools. Os locais de configuração estão preparados, mas não criamos propriedades nem inventamos tokens/IDs.

## 9. Plano do Perfil da Empresa no Google

**Pendente de execução pelo administrador.**

| Período | Ações |
| --- | --- |
| Dias 1–7 | Conferir nome comercial, categoria principal e secundárias disponíveis na conta, telefone, endereço e marcador. Confirmar horários e atendimento por idioma. |
| Dias 8–15 | Revisar descrição e serviços reais. Publicar fotos reais da escola, equipe e ponto de encontro. Vincular o domínio definitivo e o link comercial permitido no perfil. |
| Dias 16–23 | Pedir avaliações genuínas a clientes atendidos, sem incentivos nem seleção apenas de clientes satisfeitos. Responder às avaliações no idioma do cliente quando possível. |
| Dias 24–30 | Conferir consistência de dados com o site. Analisar buscas, ligações, rotas e cliques disponíveis na conta. Ajustar informações desatualizadas e registrar uma linha de base para o mês seguinte. |

Não acessamos nem modificamos o perfil do Google nesta execução. Não há garantia de posição no Maps ou nos resultados orgânicos.

## 10. O que falta para o lançamento definitivo

1. Domínio e definição da origem canônica final.
2. Reconfirmação de telefone, endereço completo, marcador, horários, nota e quantidade de avaliações que já constavam da home.
3. Revisão comercial dos detalhes não confirmados: preços, duração, equipamento incluído e cancelamento. O site orienta consultar a equipe, sem inventar respostas.
4. Revisão visual desktop/mobile no ambiente suportado e teste humano do WhatsApp.
5. Configurar produção para permitir indexação e testar respostas HTTP 200/404 no domínio final.
6. Conectar Search Console/Bing e, se desejado, Analytics com consentimento.

As instruções operacionais e as fontes oficiais ficam no `README.md`.
