# Verificación de API para funcionalidades del dashboard

Verificación realizada el 2026-09-30 contra `GET http://localhost:8000/openapi.json` y respuestas HTTP reales del backend en `localhost:8000`. No se modificaron tipos, componentes ni backend.

Convencion: ✅ verificado en `/docs` (contrato OpenAPI y/o respuesta en vivo); ❌ el requisito del PM no coincide con el comportamiento real, se indica la correccion; ❓ decision o comportamiento pendiente de confirmar.

## Endpoints

Todos los endpoints listados usan `GET`. Los parámetros son de query. `string (date)` significa fecha ISO `YYYY-MM-DD`; en OpenAPI las fechas opcionales se representan como `string | null`. Los rangos con ambas fechas se rechazan con HTTP 422 si `start_date > end_date`.

| Estado | Ruta | Query params: nombre, tipo, obligatorio, valores validos | Esquema de respuesta 200 |
| --- | --- | --- | --- |
| ✅ | `/api/metrics` | `start_date`: string (date), no, fecha válida; `end_date`: string (date), no, fecha válida; `category`: string, no, `suppliers` / `sales` / `operational` / `administrative` / `others`; `operation_type`: string, no, `income` / `outcome`. | Array de `FinancialMovement`: objeto con `create_date` (string date), `amount` (number), `operation_type` (enum), `category` (enum), `business_type` (`B2B` / `B2C`). Todos los campos son requeridos. Orden cronológico ascendente por `create_date`. |
| ✅ | `/api/metrics/facets` | Sin parámetros. | `MetricsFacets`: `operation_types` (array de `income` / `outcome`), `business_types` (array de `B2B` / `B2C`), `categories` (array de las cinco categorías anteriores), `min_date` y `max_date` (string date). Todos requeridos. |
| ✅ | `/api/metrics/alerts` | `threshold`: number, no, default `0.3`, mínimo `0`, sin máximo publicado; `group_by`: string, no, default `month`, `day` / `week` / `month`; `start_date`, `end_date`: string (date), no; `business_type`: string, no, `B2B` / `B2C`. | Array de `MetricsAlert`: `period` (string), `outcome_total` (number), `baseline_average` (number), `increase_ratio` (number). Todos requeridos. |
| ✅ | `/api/metrics/categories/top` | `operation_type`: string, no, default `outcome`, `income` / `outcome`; `limit`: integer, no, default `5`, entre `1` y `20`; `start_date`, `end_date`: string (date), no; `business_type`: string, no, `B2B` / `B2C`. | Array de `TopCategoryItem`: `category` (enum), `operation_type` (enum), `total_amount` (number). Todos requeridos; ordenado por importe descendente. |
| ✅ | `/api/metrics/summary` (adicional para los totales del gráfico F3) | `group_by`: string, no, default `month`, `day` / `week` / `month`; `start_date`, `end_date`: string (date), no; `category`: string, no, las cinco categorías; `operation_type`: string, no, `income` / `outcome`; `business_type`: string, no, `B2B` / `B2C`. | Array de `MetricsSummaryItem`: `period` (string), `income`, `outcome`, `net` (number). Todos requeridos. |

La descarga de OpenAPI confirma los tipos, enums, defaults y límites indicados. En respuestas reales se verificó que los parámetros de fecha funcionan también cuando se envía solo `start_date` o solo `end_date`; los intervalos sin movimientos responden `200` con `[]`.

## Respuestas de ejemplo

Extractos de las respuestas reales; los importes y el rango corresponden al dataset mock observado durante esta verificación.

`GET /api/metrics` sin parametros devolvio 360 movimientos. Extracto:

```json
[
  {
    "create_date": "2025-09-02",
    "amount": 8329.88,
    "operation_type": "outcome",
    "category": "others",
    "business_type": "B2B"
  }
]
```

Con solo `start_date=2026-01-01` devolvió 240; con solo `end_date=2025-12-31`, 120. El rango `1900-01-01` a `1900-01-31` devolvió `[]`. El mínimo y máximo observados por facetas fueron `2025-09-02` y `2026-08-28`.

`GET /api/metrics/facets`:

```json
{
  "operation_types": ["income", "outcome"],
  "business_types": ["B2B", "B2C"],
  "categories": ["administrative", "operational", "others", "sales", "suppliers"],
  "min_date": "2025-09-02",
  "max_date": "2026-08-28"
}
```

`GET /api/metrics/alerts` sin parámetros devolvió 4 alertas. Primer y último elemento:

```json
[
  {
    "period": "2025-12",
    "outcome_total": 103378.98,
    "baseline_average": 59573.44,
    "increase_ratio": 0.7353
  },
  {
    "period": "2026-08",
    "outcome_total": 82189.37,
    "baseline_average": 61812.99,
    "increase_ratio": 0.3296
  }
]
```

Con `threshold=0.01` devolvió 4 alertas; con `threshold=1.0`, `[]`. `threshold=1.01` también respondió `200` (en este dataset, `[]`); un valor negativo respondió `422`. Solo inicio (`2026-01-01`) devolvió 3 alertas; solo fin (`2025-12-31`), 1; rango sin datos, `[]`.

La forma real de `period` cambia con `group_by`: mensual `2025-12`, diario `2025-09-11`, semanal ISO `2025-W37`. Con `threshold=0.01`, las consultas `group_by=day` y `group_by=week` devolvieron respectivamente 85 y 20 alertas.

`GET /api/metrics/categories/top?operation_type=income&limit=5` devolvió solo dos categorías de ingreso, no cinco:

```json
[
  {"category": "sales", "operation_type": "income", "total_amount": 1132097.38},
  {"category": "others", "operation_type": "income", "total_amount": 126049.49}
]
```

Con `business_type=B2B` devolvió `sales=557903.97` y `others=57636.75`; con `business_type=B2C`, `sales=574193.41` y `others=68412.74`. El endpoint sin parámetros devolvió cuatro categorías de egreso (top predeterminado `outcome`). Fecha sin resultados devolvió `[]`.

`GET /api/metrics/summary` sin parámetros devolvió 12 períodos mensuales; el primero fue `{"period":"2025-09","income":67000.47,"outcome":76372.13,"net":-9371.66}` y el último `{"period":"2026-08","income":84954.57,"outcome":82189.37,"net":2765.2}`. Con `operation_type=income`, `group_by=month` y el rango completo, la suma de `income` fue `615540.72` para B2B y `642606.15` para B2C. Esos totales verifican una fuente para el gráfico F3. Rango sin resultados devolvió `[]`.

## Patron de fetch existente

En [App.tsx](../src/App.tsx), el dashboard usa `fetch` nativo, con base `import.meta.env.VITE_API_BASE_URL ?? ""`. `fetchFinancialData()` solicita una sola vez `/api/metrics`, comprueba `response.ok`, lanza error si falla y retorna `response.json()`. `useEffect` carga los movimientos al montar la página; no hay cliente HTTP compartido, serialización de query params, filtros de fecha ni segunda carga al cambiar filtros. El error de red se convierte en un mensaje genérico en español.

El contrato del frontend en [financial-types.ts](../src/lib/financial-types.ts) representa `create_date` como `string` con comentario ISO. [financial-utils.ts](../src/lib/financial-utils.ts) la pasa a `new Date(...)` para agregar por mes. No se encontró formato/parseo de inputs de fecha ni un patrón existente de `YYYY-MM-DD` en la UI. Además, `DashboardHeader` recibe hoy el período fijo `2024 - Full Year`, que contradice el rango real devuelto por facetas.

## Layout actual del frontend

- Existe una sola ruta, `/`. No hay router ni otras páginas configuradas en la app.
- De arriba hacia abajo: encabezado `Financial Overview` con el período fijo `2024 - Full Year`; mensaje de error cuando falla la carga; cuatro KPIs (`Total Income`, `Total Outcome`, `Profit`, `Profit Margin`); dos gráficos mensuales en paralelo (`Income vs. Outcome` y `Profit Margin %`). No hay tablas.
- El proxy de Vite para `/api` apunta a `backend:8000`, nombre del servicio en la red de Docker Compose. Fuera de Compose, el proceso Vite no resuelve ese nombre y la llamada proxificada responde `502`. Es una condición del entorno de desarrollo, no un requisito funcional de la API ni de las specs.

## Desajustes PM vs API

1. ❌ **F2 pide media móvil de los 3 períodos anteriores.** La API llama al campo `baseline_average`, pero `detect_outcome_alerts` promedia todos los períodos anteriores disponibles en la consulta, no una ventana de tres. La API tampoco devuelve una serie de tres períodos con la que corregir solo la presentación. **Resolución en la spec:** dejar esta columna/criterio como bloqueante y no etiquetar `baseline_average` como media móvil de tres períodos hasta que se decida cambiar el requisito o el contrato/backend. No inventar ni aproximar el valor.
2. ❌ **El rango de threshold del PM no coincide con el limite API.** El PM pide `0.01` a `1.0`; OpenAPI declara `minimum: 0` y no declara maximo. En vivo, `1.01` se acepta con HTTP 200 y valores negativos reciben 422. **Resolucion en la spec:** validar en la UI `0.01 <= threshold <= 1.0` y enviar el ratio, sin asumir que el backend aplica el maximo.
3. ❌ **“Top 5” no garantiza cinco filas.** Con `operation_type=income&limit=5`, la respuesta real contiene dos categorías (`sales`, `others`); el endpoint omite categorías sin movimientos, no las rellena con cero. Facetas lista cinco categorías posibles, pero no define cuáles aplican a cada operación. **Resolución en la spec:** mostrar hasta cinco categorías efectivamente devueltas, sin inventar filas; consultar si se deben completar categorías ausentes con cero.
4. ❌ **El PM habla de “nombre”, “ingresos” y “porcentaje”, pero esos no son los nombres del payload.** La API devuelve `category`, `total_amount` y `operation_type`; no devuelve porcentaje. **Resolucion en la spec:** mapear `category` a la etiqueta, `total_amount` al importe y calcular el porcentaje como `total_amount / ingresos_totales_del_grupo * 100`. Obtener ese denominador con `/api/metrics/summary`, filtrando `operation_type=income`, fechas y `business_type`, y sumando `income` en sus periodos.
5. ❌ **El endpoint de categorías top no separa por sí solo los grupos.** Si se omite `business_type`, agrega B2B y B2C juntos. **Resolución en la spec:** efectuar una consulta para `business_type=B2B` y otra para `business_type=B2C`; ambos valores están confirmados por OpenAPI y por `/api/metrics/facets`.
6. ❌ **`/api/metrics` no acepta `business_type`.** Sus filtros son fechas, categoría y tipo de operación. **Resolución en la spec:** usar `business_type` en `/api/metrics/categories/top` y `/api/metrics/summary` para F3; no asumir que se puede filtrar con ese parámetro en el endpoint principal.
7. ❌ **“Período” no es una fecha uniforme.** `MetricsAlert.period` es `string`; según `group_by` devuelve mes `YYYY-MM`, día `YYYY-MM-DD` o semana ISO `YYYY-Www`. **Resolución en la spec:** fijar `group_by=month` para F2 salvo que producto elija otra granularidad, y tratar el valor como etiqueta de período, no parsearlo siempre como fecha.
8. ❌ **Los nombres de fecha de movimientos y filtros difieren.** El movimiento usa `create_date`, mientras que los parámetros son `start_date` y `end_date`; no existe un campo de respuesta llamado `date`. **Resolución en la spec:** conservar esos identificadores exactos y mandar fechas ISO `YYYY-MM-DD`; omitir cada parámetro cuando su input esté vacío.
9. ❌ **El rango de F1 no define el contexto histórico para alertas.** `alerts` acepta ambos parámetros de fecha, pero el backend filtra movimientos por rango antes de agrupar y calcular el baseline. Por tanto, períodos previos al rango no participan en el promedio de las alertas visibles. **Resolución en la spec:** pasar el rango activo a alerts, pero definir si el baseline debe limitarse también al rango o si debe usar historia anterior fuera del rango; el contrato actual solo implementa la primera opción.
10. ❌ **F3 pide una página nueva, pero la app solo tiene `/` y no tiene ruteo.** No hay router configurado ni otras páginas. **Resolución acordada:** decisión 8 fija `/b2b-vs-b2c`, los enlaces de navegación entre ambas páginas y la incorporación de ruteo cliente. **Estado:** cerrado para la especificación.
11. ❌ **F1 pide filtrar todos los datos de la página; ahora los KPIs y gráficos se calculan con una única respuesta.** Los cuatro KPIs (`Total Income`, `Total Outcome`, `Profit`, `Profit Margin`) se calculan en `computeKPIs(movements)` y los dos gráficos (`Income vs. Outcome`, `Profit Margin %`) se derivan de `computeMonthlyData(movements)`. Ambas funciones reciben exclusivamente los movimientos cargados por `GET /api/metrics`; no se usa otro endpoint para estas seis visualizaciones. OpenAPI confirma que `/api/metrics` acepta `start_date` y `end_date` opcionales, ambos `string` con formato `date` (`YYYY-MM-DD`); llamadas reales verificaron filtros con solo inicio, solo fin y ambos. **Resolución en la spec:** aplicar el rango seleccionado a la solicitud de `/api/metrics` y derivar de esa misma respuesta los cuatro KPIs y ambos gráficos, evitando que una visualización quede sin filtrar.
12. ❌ **El encabezado muestra un período fijo que no refleja ni el filtro ni el dataset.** Hoy `DashboardHeader` recibe `2024 - Full Year`; facetas devolvió `min_date=2025-09-02` y `max_date=2026-08-28`. **Resolución en la spec:** mostrar el rango seleccionado cuando haya filtros y, cuando no haya ninguno, el rango completo `min_date`–`max_date` obtenido de `/api/metrics/facets`.

## Preguntas abiertas

1. ❓ ¿F2 debe conservar literalmente la media móvil de los tres períodos previos (lo que requiere cambiar/extender la API o su criterio de alertas), o se autoriza cambiar el requisito para mostrar el promedio de todos los períodos previos que calcula hoy `baseline_average`?
2. ❓ Si F1 limita las alertas, ¿el baseline también debe excluir períodos anteriores al rango (comportamiento actual) o el rango solo debe limitar los períodos que aparecen en la tabla?
3. ❓ Para F3, ¿se muestran solo las dos categorías de ingreso devueltas actualmente o se completa hasta cinco usando `facets.categories`, asignando cero a las categorías ausentes?

## Decisiones

8\. **Página F3 y navegación:** la página comparativa usa la ruta `/b2b-vs-b2c`. El encabezado incluye enlaces en ambas direcciones: `Resumen` → `/` y `B2B vs B2C` → `/b2b-vs-b2c`. Se requiere ruteo del lado del cliente. Revisado `frontend/package.json`: no aparece `react-router-dom` ni otra librería de ruteo entre las dependencias; incorporar una es una dependencia de implementación. No se instala ninguna librería en esta fase.
9\. **Rango de fechas compartido:** el filtro se mantiene en los query params `start_date` y `end_date`, con los nombres exactos de la API. Debe sobrevivir a la navegación entre `/` y `/b2b-vs-b2c`, a una recarga y permitir compartir la URL. Ambas páginas leen y escriben el mismo `DateRangeFilter` a partir de esos parámetros; cuando una fecha está vacía, se omite su parámetro.
10\. **Cierre del desajuste 10:** queda resuelto con la decisión 8: path, enlaces de navegación y necesidad de incorporar ruteo cliente ya están definidos.

## Cierre de fase 1

No hay un documento tipo changelog en el repositorio. Se registra el proceso aquí, junto a la verificación de contratos que sustenta las futuras especificaciones.

- Se descargó `/openapi.json` del backend en vivo y se contrastaron los contratos de `/api/metrics`, `/api/metrics/facets`, `/api/metrics/alerts`, `/api/metrics/categories/top` y `/api/metrics/summary`.
- Se probaron respuestas reales con defaults, filtros de fechas completos y parciales, rangos sin resultados y límites de `threshold`; se anotaron esquemas, valores y comportamiento observable.
- Se rastreó el frontend actual: `GET /api/metrics` alimenta los cuatro KPIs y los dos gráficos; se documentaron el layout, el fetch, la ausencia de rutas y el proxy de Vite.
- Se registraron las decisiones de ruta y navegación F3, el filtro `DateRangeFilter` compartido por URL y las discrepancias entre requisitos y contrato/comportamiento existentes.
- El alcance se mantuvo en documentación dentro de `frontend/specs/`: no se modificaron componentes, tipos, dependencias ni backend, y no se creó ninguna spec de funcionalidad.
- Quedan tres preguntas abiertas antes de cerrar los criterios funcionales: media móvil de F2, baseline de alertas al filtrar fechas y categorías ausentes en F3.

**Estado:** fase 1 de exploración y verificación documentada. No se han creado tipos ni specs de funcionalidad. No se ha hecho commit; requiere confirmación explícita.
