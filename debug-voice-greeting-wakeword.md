# [OPEN] Debug Session: voice-greeting-wakeword

## Sintoma
- Ao habilitar o audio, o orb conecta mas nao fala a saudacao inicial.
- O wake word foi alterado no `.env`, mas o comportamento ainda aparenta esperar `isaac`.

## Escopo
- `apps/frontend/src/app/shop/page.tsx`
- Variaveis `NEXT_PUBLIC_GEMINI_WAKE_WORDS`, `NEXT_PUBLIC_GEMINI_LIVE_*`

## Hipoteses
1. O `next dev` em execucao nao foi reiniciado, entao o cliente continua com as variaveis `NEXT_PUBLIC_*` antigas embutidas.
2. A saudacao automatica esta sendo enviada no `onopen`, mas o servidor/SDK nao gera audio para esse turno inicial por ordem de eventos ou por estado da sessao.
3. O reconhecimento de voz usa os wake words corretos, mas a comparacao do transcript/interim esta aceitando texto anterior ou mantendo estado antigo do bundle.
4. O orb conecta com sucesso, mas o audio de saida inicial nao toca por falta de chunk de audio/transcricao no primeiro turno.
5. O valor de `NEXT_PUBLIC_GEMINI_WAKE_WORDS` esta chegando vazio/inalterado no bundle do cliente, disparando o fallback para a lista padrao com `isaac`.

## Plano
- Instrumentar somente o fluxo de conexao, leitura de env publico, wake words parseados e primeiro turno automatico.
- Reproduzir a conexao de voz.
- Analisar evidencias e aplicar a menor correcao necessaria.

## Evidencias
- Pendente.

## Resultado
- Em aberto.
