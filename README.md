# Kurio — Marketplace de NFTs

Marketplace responsivo de NFTs criado em React, TypeScript e Next.js. A aplicação disponibiliza mocks MSW para a API REST e Socket.IO para eventos de preço, disponibilidade e pedido.

## Executar

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

Para ativar a interceptação de rede por MSW no navegador, inicie com `NEXT_PUBLIC_USE_MSW=true npm run dev`. As rotas locais `/api` fornecem o mesmo cenário como fallback, inclusive em testes E2E.

## Comandos

| Comando | Finalidade |
| --- | --- |
| `npm run dev` | Ambiente de desenvolvimento com mocks |
| `npm run build` | Build e verificação de tipos |
| `npm run start` | Servidor de produção |
| `npm run preview` | Preview da build de produção |
| `npm run lint` | Lint |
| `npm run typecheck` | Verificação de tipos sem gerar arquivos |
| `npm run test:e2e` | Testes Playwright desktop e mobile |
| `npm run test:e2e:ui` | Interface do Playwright |
| `npm run test:visual` | Regressão visual das telas principais |
| `npm run audit:lighthouse` | Auditoria Lighthouse (requer `npm run start` em outra janela) |

Antes da primeira execução dos testes, instale os navegadores:

```bash
npx playwright install chromium
```

Para auditar, gere o build, inicie o servidor de produção e execute `npm run audit:lighthouse`. O comando faz três medições em início e detalhe, nos perfis desktop e mobile, e grava os relatórios HTML/JSON versionados em `lighthouse-reports/`. O resumo inclui versões e condições do ambiente, além das medianas de LCP, CLS e TBT.

## Credenciais e cenários

Login aceita qualquer e-mail válido com senha de ao menos seis caracteres. O e-mail `existente@kurio.io` gera um conflito de cadastro propositalmente.

Não há variáveis obrigatórias. Defina `NEXT_PUBLIC_USE_MSW=true` para atender as chamadas por MSW no navegador; sem ela, as rotas locais de `/api` oferecem os mesmos contratos. Para retornar ao estado conhecido dos mocks, envie `POST /api/scenario/reset`: pedidos, perfis, carrinhos, carteiras, favoritos, contas criadas durante o teste e a persistência IndexedDB do MSW são restaurados. As chaves de navegador (`localStorage` e `sessionStorage`) pertencem à sessão do navegador e devem ser limpas pelo teste manual quando necessário.

O cupom `KURIO10` aplica 10% de desconto. Favoritar o NFT `Ivory Baron #088` retorna falha HTTP 503; a interface aplica e então reverte a mudança, demonstrando rollback otimista.

Após se inscrever no catálogo, o mock Socket.IO emite `nft.updated` para o NFT `#042`. Ao confirmar um pedido, a API valida disponibilidade, edição e cotação; uma chave de idempotência impede a criação duplicada antes de `order.updated` o mudar de pendente para confirmado.

Para demonstrar falhas de pagamento durante testes manuais, defina `kurio-scenario` no `localStorage` como `payment-refused`, `timeout-after-order`, `connection-interrupted` ou `network-unavailable`. No segundo caso, o pedido é salvo no servidor antes da resposta 504: basta reenviar a mesma tentativa para recuperá-lo sem duplicação. No terceiro, o cliente Socket.IO reconecta e consulta pedidos pendentes novamente por REST. `network-unavailable` devolve HTTP 503 no catálogo, cotação e pedido. Com MSW ativo, pedidos são persistidos em IndexedDB para que essa recuperação também sobreviva a um reload. O recibo consulta `GET /api/orders/:id` se o estado local não estiver disponível.

Para validar estados de cotação sem manter o cenário após fechar a aba, use `sessionStorage`: `slow-quote` aplica 1,6 s de latência e `quote-changed` retorna conflito de cotação, bloqueando a confirmação até nova revisão. O cenário `out-of-order` faz a primeira página do catálogo responder depois da próxima página, e `stale-events` emite uma atualização de catálogo nova seguida por uma antiga; a interface conserva a versão mais recente.

Exemplo no console do navegador:

```js
localStorage.setItem("kurio-scenario", "payment-refused")
// ou: localStorage.setItem("kurio-scenario", "timeout-after-order")
// ou: localStorage.setItem("kurio-scenario", "connection-interrupted")
// ou: localStorage.setItem("kurio-scenario", "network-unavailable")
sessionStorage.setItem("kurio-scenario", "slow-quote")
// ou: sessionStorage.setItem("kurio-scenario", "quote-changed")
// ou: sessionStorage.setItem("kurio-scenario", "out-of-order")
// ou: sessionStorage.setItem("kurio-scenario", "stale-events")
```

Remova a chave com `localStorage.removeItem("kurio-scenario")` ou `sessionStorage.removeItem("kurio-scenario")` antes de testar o fluxo padrão.

## Arquitetura

- `app/services`: cliente Axios e contratos de transporte.
- `app/mocks`: fixtures, handlers REST e ponte Socket.IO com MSW.
- `app/hooks`: queries TanStack Query e assinaturas de tempo real.
- `app/Contexts`: sessão, carrinho, pedidos e carteiras persistidos no navegador.
- `app/Components`: componentes modulares da interface.

O projeto usa Tailwind CSS 4 nas primitives de interface e CSS Modules para preservar a composição visual específica dos frames. A configuração [components.json](components.json) e a primitive [Button](app/Components/ui/button.tsx) seguem o padrão shadcn/ui, adaptado aos tokens visuais da Kurio.

As queries usam `staleTime` de 30 segundos e uma tentativa de repetição. Eventos mais novos substituem versões antigas do catálogo; mutations de favoritos fazem atualização otimista, invalidam o cache após a resposta e restauram o snapshot em caso de erro. Os valores em ETH permanecem como strings e são calculados em unidades inteiras de 18 casas decimais, evitando erros de ponto flutuante em cotação e pedido.

Consulte [ARCHITECTURE.md](ARCHITECTURE.md) para contratos, persistência, decisões de cache, eventos e limitações conhecidas.
