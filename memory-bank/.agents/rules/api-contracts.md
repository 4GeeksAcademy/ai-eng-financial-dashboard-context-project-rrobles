# api-contracts

## Scope
Aplica a todos los endpoints HTTP del backend y a cualquier cambio de respuesta esperada.

## Justification
La API define contratos explícitos con modelos de respuesta en [backend/app/routes.py](../../../backend/app/routes.py). Mantener esos contratos evita desalineaciones entre backend, frontend y documentación.

## Project guidance
- Define `response_model` para cada endpoint nuevo o modificado.
- Mantén nombres y tipos estables para `FinancialMovement`, `MetricsSummaryItem`, `MetricsComparison`, `MetricsAlert` y `TopCategoryItem`.
- Si un endpoint devuelve listas, documenta su estructura y orden esperado.
- Si se añaden nuevos campos, propágarlos a [frontend/src/lib/financial-types.ts](../../../frontend/src/lib/financial-types.ts) y a la lógica de consumo en [frontend/src/App.tsx](../../../frontend/src/App.tsx).

## Apply here
- [backend/app/routes.py](../../../backend/app/routes.py)
- [backend/app/main.py](../../../backend/app/main.py)
- [frontend/src/lib/financial-types.ts](../../../frontend/src/lib/financial-types.ts)
