# Penpot Design Rules

These rules apply when `penpot` is the selected MAWA design adapter.

MAWA assumes external MCP/tooling is already configured.

Do not create or modify design artifacts unless the design stage is active and the human has confirmed access.

# Penpot Adapter Rules

Use estas regras apenas quando o engine visual escolhido for Penpot.

## Prioridades

1. Preservar hierarquia semântica.
2. Preservar ícones/SVGs sem mutação interna.
3. Usar tokens DareDash.
4. Criar grupos reutilizáveis.
5. Validar layers e screenshots.

## Grupos

Ao criar elementos no Penpot, organize tudo em grupos/frames semânticos. Não crie shapes soltos.

## Ícones

Se o Penpot/MCP alterar SVG de forma destrutiva, pare e use placeholder semântico. Nunca tente corrigir path manualmente.

## Operações

Faça alterações por regiões:

1. frame raiz;
2. shell;
3. sidebar/topbar;
4. page header;
5. conteúdo principal;
6. estados;
7. revisão.

## Revisão

Ao final, revise a árvore de layers, componentes repetidos, agrupamento e screenshots.
