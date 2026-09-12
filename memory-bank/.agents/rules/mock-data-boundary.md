# mock-data-boundary

## Scope
Aplica a la generación de datos y a cualquier lógica que simule negocio o historial financiero.

## Justification
Los endpoints generan datos simulados con `generate_mock_movements(seed=42)` en [backend/app/routes.py](../../backend/app/routes.py). Esto es útil para demo y pruebas, pero no debe confundirse con datos reales de negocio.

## Project guidance
- Mantén la generación mock explícita y separada de la capa de persistencia real.
- No asumir que las métricas son históricas reales solo porque se exponen en la API.
- Si se añade una fuente de datos real, mover la lógica fuera de la ruta y mantener esta capa como fallback o demo.
- Reutilizar la misma semilla y el dataset determinista solo para pruebas reproducibles.

## Apply here
- [backend/app/routes.py](../../backend/app/routes.py)
- [backend/tests/test_routes.py](../../backend/tests/test_routes.py)
