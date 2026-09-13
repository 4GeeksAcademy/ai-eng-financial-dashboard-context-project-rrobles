# frontend-data-flow

## Scope
Aplica al flujo de consumo de datos del frontend y a la transformación que hacen los componentes.

## Justification
El frontend carga la API en [frontend/src/App.tsx](../../../frontend/src/App.tsx) y calcula KPIs y series mensuales en [frontend/src/lib/financial-utils.ts](../../../frontend/src/lib/financial-utils.ts). La capa visual no debe crear lógica de negocio duplicada.

## Project guidance
- Mantener fetch y transformación separados.
- Los componentes deben consumir datos ya procesados, no calcular negocio en el render.
- Si se cambia el contrato del backend, actualizar primero el tipo en [frontend/src/lib/financial-types.ts](../../../frontend/src/lib/financial-types.ts) y luego la lógica de cálculo.
- Mantener estados de carga y error visibles para el usuario.

## Apply here
- [frontend/src/App.tsx](../../../frontend/src/App.tsx)
- [frontend/src/lib/financial-utils.ts](../../../frontend/src/lib/financial-utils.ts)
- [frontend/src/lib/financial-types.ts](../../../frontend/src/lib/financial-types.ts)
