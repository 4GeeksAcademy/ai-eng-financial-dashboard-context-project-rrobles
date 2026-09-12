# date-validation

## Scope
Aplica a todos los endpoints que reciben `start_date` y `end_date`, especialmente a la comparación por periodo en [backend/app/routes.py](../../backend/app/routes.py).

## Justification
La regla debe garantizar que el rango de fechas sea coherente antes de ejecutar la lógica de negocio. El repositorio actualmente acepta fechas invertidas sin un error explícito, por ejemplo en `GET /api/metrics/comparison`.

## Project guidance
- Validar antes del cálculo: si `start_date > end_date`, devolver un error de validación y no seguir con la consulta.
- Usar `HTTP 400` o `HTTP 422` con un mensaje claro, por ejemplo: `"start_date must be less than or equal to end_date"`.
- Mantener la comprobación en la ruta que recibe los parámetros, no solo en el frontend.
- Documentar el criterio del período anterior en la comparación temporal.
- Añadir una prueba de regresión en [backend/tests/test_routes.py](../../backend/tests/test_routes.py) para validar fechas invertidas.

## Executable task
1. Ejecutar:
   ```bash
   curl "http://localhost:8000/api/metrics/comparison?start_date=2025-03-31&end_date=2025-03-01"
   ```
2. Esperar una respuesta de error de validación.
3. Confirmar que la API no devuelve un resultado financiero con fechas inversas.

## Apply here
- [backend/app/routes.py](../../backend/app/routes.py)
- [backend/tests/test_routes.py](../../backend/tests/test_routes.py)
- [backend/app/main.py](../../backend/app/main.py)
