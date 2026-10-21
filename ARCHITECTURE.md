# Arquitetura — Kurio Marketplace

## Visão geral

O projeto usa Next.js App Router para as rotas de interface, React + TypeScript para a camada de apresentação, Tailwind CSS 4 nas primitives e CSS Modules nos componentes. A organização preserva o padrão do projeto-base: cada componente possui uma pasta própria, um index.tsx e seu módulo de estilos. As primitives shadcn/ui ficam em `app/Components/ui`, com configuração declarada em `components.json`, e recebem os tokens de cor da Kurio.

## Camadas

| Camada | Responsabilidade |
| --- | --- |
| app/Components | Componentes visuais e formulários reutilizáveis |
| app/Pages | Composição de cada fluxo de tela |
| app/Contexts | Estados persistentes de sessão, carrinho, pedidos e carteiras |
| app/services | Axios, contratos de transporte e cliente Socket.IO |
| app/hooks | Queries, mutations e assinaturas de atualizações em tempo real |
| app/mocks | Fixtures e handlers MSW de REST/WebSocket |
| app/api | Fallback local equivalente aos cenários REST, usado em E2E e quando o MSW não está ativo |

## Rotas

| Rota | Função |
| --- | --- |
| / | Descoberta, busca, filtros, ordenação e paginação |
| /nft/:nftId | Detalhe do NFT |
| /carrinho | Carrinho persistente |
| /pagamento | Checkout protegido |
| /pedido/:orderId | Acompanhamento e recibo do pedido |
| /login | Entrada na conta |
| /cadastro | Criação de conta |
| /perfil | Perfil do colecionador |
| /carteiras | Carteiras e redes |

TanStack Router é o roteador efetivo da interface; o App Router do Next entrega o shell e os handlers REST. Os parâmetros search, min, max, sort e page representam o estado do catálogo na URL.

## Contratos e mocks

Os contratos ficam em app/services/contracts.ts. A listagem de NFTs usa GET /api/nfts, aceitando busca, faixa de preço, ordenação e paginação.

Para executar somente com os handlers MSW, use `NEXT_PUBLIC_USE_MSW=true`. Sem essa variável, as route handlers locais disponibilizam o mesmo formato de resposta. Os testes E2E ativam MSW por padrão. Pedidos dos handlers são persistidos em IndexedDB, preservando o recibo quando a página é recarregada; `POST /api/scenario/reset` restaura pedidos, perfis, carrinhos, carteiras, favoritos, contas transitórias e a persistência IndexedDB. A persistência do navegador permanece sob controle do cliente de teste.

Os contratos de pedido são `POST /api/orders`, com `Idempotency-Key`, e `GET /api/orders/:id`, para consulta do recibo. Os cenários são ativados pelo cabeçalho `X-Kurio-Scenario`, preenchido a partir de `localStorage.kurio-scenario` ou `sessionStorage.kurio-scenario` pelo cliente Axios. `slow-quote`, `quote-changed`, `network-unavailable` e `out-of-order` reproduzem latência, conflito, HTTP 503 e respostas de páginas em ordem inversa. `payment-refused` e `timeout-after-order` preservam os cenários de pedido terminal e timeout após persistência.

## Cache e consistência

- TanStack Query mantém cache de catálogo e favoritos.
- As chaves de favoritos incluem o e-mail da sessão; carrinho, pedidos e carteiras persistem em chaves locais separadas por conta.
- Consultas usam uma repetição e estado inicial para impedir deslocamento visual do catálogo.
- Favoritos usam atualização otimista; em falha, o snapshot anterior é restaurado.
- Eventos nft.updated só substituem dados com versão superior.
- O carrinho atualiza o preço de NFTs afetados em tempo real.
- Um pedido é salvo como pendente antes da confirmação. Apenas o evento order.updated terminal limpa os itens comprados.
- O recibo busca o pedido via REST se o snapshot local não estiver disponível, preservando preços, taxas e totais da criação.
- Valores ETH são convertidos para unidades inteiras de 18 casas durante os cálculos e formatados novamente apenas na resposta; assim, cotação, desconto e total não usam ponto flutuante.

## Persistência e sessão

Sessão, carrinho, pedidos e carteiras usam localStorage como persistência de demonstração. Senhas não são gravadas no navegador. O carrinho visitante usa uma chave própria e é mesclado com o carrinho remoto da conta no primeiro login; os dados privados não são reutilizados pela conta seguinte. Se a API devolver 401 durante `/pagamento`, o cliente remove a sessão privada, registra o retorno para o checkout e conserva o carrinho por conta para que o fluxo seja retomado após um novo login.

## Tempo real

O cliente usa socket.io-client. O handler MSW usa @mswjs/socket.io-binding para emitir o cenário de catálogo e concluir pedidos. Após uma nova conexão, as queries de catálogo são invalidadas e pedidos pendentes são consultados novamente por REST; eventos terminais carregam versão e identificador do usuário para ignorar duplicatas, eventos antigos e dados de outra sessão. O cenário `connection-interrupted` interrompe o socket após a criação e confirma o pedido no mock, permitindo validar a recuperação por reconciliação. O cenário `stale-events` foi preparado para emitir uma versão 3 seguida de uma versão 2, mas sua entrega ao cliente ainda não está estabilizada no fluxo E2E e permanece como pendência conhecida antes de considerar a simulação de eventos fora de ordem concluída. A ponte de mocks não simula recursos avançados do Socket.IO, como salas ou broadcasting entre vários navegadores.

## Decisões e limitações

- O App Router do Next permanece como shell de publicação e TanStack Router controla a navegação da aplicação, incluindo parâmetros de busca e rotas protegidas.
- O layout usa ilustrações CSS em vez dos assets de personagem originais, porque os prints são referências raster sem assets reutilizáveis separados.
- O checkout, autenticação e carteiras são integrações simuladas. Blockchain, extensões de carteira e gateways reais permanecem fora do escopo.
- A auditoria Lighthouse é executada sobre a build otimizada e mantém três amostras por página/perfil em `lighthouse-reports/`. Telas não críticas, providers de carteiras e pedidos e o cliente Socket.IO são carregados somente nas rotas que os utilizam. A home entrega uma prévia estática e a rota Next `/nft/[nftId]` transmite um shell com dados públicos da fixture dentro de `Suspense`; após a hidratação, o TanStack Router continua responsável pela rota, consulta e interações. Na última medição, a performance desktop foi 88 na home (LCP 1,81 s e TBT 132 ms) e 87 no detalhe (LCP 2,11 s e TBT 125 ms); portanto, a meta de 90 ainda não foi atingida nesses dois cenários. No mobile, a home marcou 92 e o detalhe 98. A tentativa de renderizar o `RouterProvider` no servidor não é compatível com a configuração atual de partial prefetching e foi descartada para preservar acesso direto e estabilidade das rotas.
- Pendências assumidas para a entrega: estabilizar o recebimento E2E de `stale-events` e elevar a performance desktop da home e do detalhe para 90 ou mais. As demais métricas Lighthouse da última auditoria ficaram acima de 90.
