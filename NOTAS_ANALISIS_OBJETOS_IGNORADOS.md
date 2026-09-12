# Notas del análisis: objetos ignorados y reglas propuestas

## 1. Objetos ignorados

- No se encontró la carpeta `.agents` en la raíz del repositorio.
- No se encontró la carpeta `memory-bank` en la raíz del repositorio.
- La carpeta `frontend/public/` existe, pero no aparece referenciada por la lógica principal ni por el flujo de datos del dashboard en `frontend/src/App.tsx`.
- El archivo `backend/tests/conftest.py` no aporta lógica de negocio ni rutas; solo prepara el entorno de pruebas.
- La carpeta `frontend/src/assets/` no aparece integrada en el flujo principal de la UI, no se referencia en `App.tsx` ni en los componentes del dashboard.

## 2. Reglas propuestas por categoría

### 2.1 API y datos

- Regla 1: no asumir persistencia real en servicios REST.
  - Hecho observado: en `backend/app/routes.py`, cada endpoint ejecuta `generate_mock_movements(seed=42)` en el cuerpo de la función antes de aplicar filtros.
  - Resultado esperado: toda operación de negocio debe pasar por una capa de acceso a datos real o explícitamente mockeada.

- Regla 2: mantener explícitos los contratos de salida de la API.
  - Hecho observado: `backend/app/routes.py` define `FinancialMovement`, `MetricsFacets`, `MetricsSummaryItem`, `TopCategoryItem`, `MetricsComparison` y `MetricsAlert` y los usa con `response_model`.
  - Resultado esperado: cada endpoint debe declarar claramente su schema de salida y no devolver objetos no tipados.

- Regla 3: validar rangos de entrada antes de ejecutar la lógica.
  - Hecho observado: `get_top_categories` usa `limit: int = Query(default=5, ge=1, le=20)` y `get_metrics_alerts` usa `threshold: float = Query(default=0.3, ge=0)`.
  - Resultado esperado: nuevas query params con semántica numérica deben incluir límites y validaciones explícitas.

- Regla 4: separar filtros de agregación.
  - Hecho observado: `filter_movements(...)` y `summarize_movements(...)` existen como funciones separadas en `backend/app/routes.py`.
  - Resultado esperado: la lógica de filtrado y la lógica de agregación no debe mezclarse en un mismo bloque.

- Regla 5: evitar fechas ambiguas en la API.
  - Hecho observado: `get_metrics_comparison` recibe `start_date` y `end_date` como `date` y calcula `previous_start` con `previous_end = start_date - timedelta(days=1)`.
  - Resultado esperado: cualquier comparación temporal debe documentar explícitamente el criterio del período anterior y su fecha base.

- Regla 6: los endpoints especializados deben reflejar segmentos explícitos del negocio.
  - Hecho observado: existen rutas `GET /api/metrics/b2b` y `GET /api/metrics/b2c` en `backend/app/routes.py`.
  - Resultado esperado: todo segmento relevante del negocio debe tener un endpoint aislado o un filtro explícito y documentado.

### 2.2 Frontend y consumo de datos

- Regla 7: el frontend debe consumir la API desde una base configurable.
  - Hecho observado: `frontend/src/App.tsx` define `const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";`.
  - Resultado esperado: la URL de origen del backend debe poder configurarse sin tocar la lógica del componente.

- Regla 8: las funciones de cálculo deben estar centralizadas y reutilizables.
  - Hecho observado: en `frontend/src/lib/financial-utils.ts` existen `computeKPIs` y `computeMonthlyData`.
  - Resultado esperado: cualquier cálculo de negocio del frontend debe vivir en utilidades compartidas y no dispersarse en componentes.

- Regla 9: no mezclar datos crudos con presentaciones visuales.
  - Hecho observado: `frontend/src/App.tsx` hace `fetchFinancialData()`, luego calcula KPI y series mensuales antes de enviar al render.
  - Resultado esperado: los componentes visuales deben recibir datos ya transformados y no tener que calcular negocio a la vez que renderizan.

- Regla 10: la vista principal debe manejar estados de carga y error.
  - Hecho observado: `frontend/src/App.tsx` define `loading` y `error`, y los usa en la renderización principal.
  - Resultado esperado: toda vista que consume una API debe mantener estados claros para carga, éxito y fallo.

### 2.3 Testing y validación

- Regla 11: las pruebas deben validar comportamientos observables de la API.
  - Hecho observado: `backend/tests/test_routes.py` comprueba 15 comportamientos, por ejemplo `test_health_endpoint_returns_ok`, `test_b2b_endpoint_only_returns_b2b_records`, `test_metrics_summary_by_month_returns_balances`.
  - Resultado esperado: cada cambio significativo debe estar cubierto por pruebas del comportamiento visible del endpoint.

- Regla 12: las pruebas deben reflejar reglas reales del dominio.
  - Hecho observado: `test_generate_mock_movements_returns_full_year_sorted_data` en `backend/tests/test_routes.py` asume 360 movimientos y orden cronológico.
  - Resultado esperado: cualquier regla de negocio nueva debe tener una prueba que la confirme con datos de ejemplo reproducibles.

### 2.4 Entorno y despliegue

- Regla 13: el arranque local debe ser reproducible con un único comando.
  - Hecho observado: `docker-compose.yml` define servicios `frontend` y `backend` con `build` y `ports` para levantar el proyecto completo.
  - Resultado esperado: el equipo debe poder levantar el entorno con una sola instrucción y sin pasos ad hoc.

- Regla 14: la API debe documentarse con Swagger en desarrollo.
  - Hecho observado: `backend/app/main.py` inicializa `FastAPI(title="Financial Metrics API")`, y la documentación por defecto de FastAPI se expone en `/docs`.
  - Resultado esperado: cada servicio nuevo debe ser verificable desde la documentación interactiva del backend.

- Regla 15: definir políticas de exposición de servicios antes de producción.
  - Hecho observado: `backend/app/main.py` usa `CORSMiddleware` con `allow_origins=["*"]`.
  - Resultado esperado: cualquier entorno no local debe restringir orígenes y definir políticas de seguridad explícitas.

## 3. Reglas de mantenimiento recomendadas

- Regla 16: no crear rutas sin modelo de respuesta asociado.
  - Hecho observado: cada ruta en `backend/app/routes.py` tiene un `response_model` o una estructura tipada clara.
  - Resultado esperado: cualquier nuevo endpoint debe incluir schema de salida y no devolver diccionarios libres sin tipado.

- Regla 17: no ocultar la semántica del negocio en nombres ambiguos.
  - Hecho observado: los nombres `income`, `outcome`, `net`, `delta_abs`, `delta_pct`, `business_type` aparecen de forma consistente en `backend/app/routes.py` y en `frontend/src/lib/financial-types.ts`.
  - Resultado esperado: nuevos campos deben seguir la misma convención semántica y no introducir términos ambiguos.

- Regla 18: mantener el origen de los datos y la capa de cálculo separados.
  - Hecho observado: `frontend/src/App.tsx` solo consume la API; la generación de datos ocurre en `backend/app/routes.py`.
  - Resultado esperado: la capa de presentación no debe duplicar la lógica de origen de los datos ni recrear la fuente de verdad.
