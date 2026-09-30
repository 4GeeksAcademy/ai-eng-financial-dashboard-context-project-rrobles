# Verificación de API para funcionalidades del dashboard

Verificación realizada el 2026-09-30 contra `GET http://localhost:8000/openapi.json` y respuestas HTTP reales del backend en `localhost:8000`. Durante la exploración inicial no se modificaron tipos, componentes ni backend.

Convencion: ✅ verificado en `/docs` (contrato OpenAPI y/o respuesta en vivo); ❌ el requisito del PM no coincide con el comportamiento real, se indica la correccion; ❓ decision o comportamiento pendiente de confirmar.

## Endpoints

Todos los endpoints listados usan `GET`. Los parámetros son de query. `string (date)` significa fecha ISO `YYYY-MM-DD`; en OpenAPI las fechas opcionales se representan como `string | null`. Los rangos con ambas fechas se rechazan con HTTP 422 si `start_date > end_date`.

| Estado | Ruta | Query params: nombre, tipo, obligatorio, valores validos | Esquema de respuesta 200 |
| --- | --- | --- | --- |
| ✅ | `/api/metrics` | `start_date`: string (date), no, fecha válida; `end_date`: string (date), no, fecha válida; `category`: string, no, `suppliers` / `sales` / `operational` / `administrative` / `others`; `operation_type`: string, no, `income` / `outcome`. | Array de `FinancialMovement`: objeto con `create_date` (string date), `amount` (number), `operation_type` (enum), `category` (enum), `business_type` (`B2B` / `B2C`). Todos los campos son requeridos. Orden cronológico ascendente por `create_date`. |
| ✅ | `/api/metrics/facets` | Sin parámetros. | `FacetsResponse` (OpenAPI schema `MetricsFacets`): `operation_types` (array de `income` / `outcome`), `business_types` (array de `B2B` / `B2C`), `categories` (array de las cinco categorías anteriores), `min_date` y `max_date` (string date). Todos requeridos. |
| ✅ | `/api/metrics/alerts` | `threshold`: number, no, default `0.3`, mínimo `0`, sin máximo publicado; `group_by`: string, no, default `month`, `day` / `week` / `month`; `start_date`, `end_date`: string (date), no; `business_type`: string, no, `B2B` / `B2C`. | Array de `AlertEntry` (OpenAPI schema `MetricsAlert`): `period` (string), `outcome_total` (number), `baseline_average` (number), `increase_ratio` (number). Todos requeridos. |
| ✅ | `/api/metrics/categories/top` | `operation_type`: string, no, default `outcome`, `income` / `outcome`; `limit`: integer, no, default `5`, entre `1` y `20`; `start_date`, `end_date`: string (date), no; `business_type`: string, no, `B2B` / `B2C`. | Array de `CategoryEntry` (OpenAPI schema `TopCategoryItem`): `category` (enum), `operation_type` (enum), `total_amount` (number). Todos requeridos; ordenado por importe descendente. |
| ✅ | `/api/metrics/summary` (adicional para los totales del gráfico F3) | `group_by`: string, no, default `month`, `day` / `week` / `month`; `start_date`, `end_date`: string (date), no; `category`: string, no, las cinco categorías; `operation_type`: string, no, `income` / `outcome`; `business_type`: string, no, `B2B` / `B2C`. | Array de `MetricsSummaryItem`: `period` (string), `income`, `outcome`, `net` (number). Todos requeridos. |

La descarga de OpenAPI confirma los tipos, enums, defaults y límites indicados. En respuestas reales se verificó que los parámetros de fecha funcionan también cuando se envía solo `start_date` o solo `end_date`; los intervalos sin movimientos responden `200` con `[]`.

## Trazabilidad de tipos

| Tipo | Campo(s) | Origen en OpenAPI |
| --- | --- | --- |
| `OperationType` | `income` / `outcome` | Enums de `operation_type` en `/api/metrics`, `/api/metrics/categories/top` y `/api/metrics/summary`. |
| `Category` | `suppliers` / `sales` / `operational` / `administrative` / `others` | Enums de `category` en `/api/metrics`, `/api/metrics/facets`, `/api/metrics/categories/top` y `/api/metrics/summary`. |
| `BusinessType` | `B2B` / `B2C` | `business_type` en `/api/metrics` y query params de `/api/metrics/alerts`, `/api/metrics/categories/top`, `/api/metrics/summary`; valores también en facets. |
| `GroupBy` | `day` / `week` / `month` | Query param `group_by` de `/api/metrics/alerts` y `/api/metrics/summary`. |
| `FinancialMovement` | `create_date`, `amount`, `operation_type`, `category`, `business_type` | Schema del mismo nombre; items del 200 de `GET /api/metrics`. |
| `MetricsResponse` | Array de `FinancialMovement` | Respuesta 200 de `GET /api/metrics` (`array` de `FinancialMovement`). El filtro de fechas no cambia el schema. |
| `FacetsResponse` | `operation_types`, `business_types`, `categories`, `min_date`, `max_date` | OpenAPI schema `MetricsFacets`; respuesta 200 de `GET /api/metrics/facets`. |
| `AlertEntry` / `AlertsResponse` | `period`, `outcome_total`, `baseline_average`, `increase_ratio`; array de entradas | OpenAPI schema `MetricsAlert`; respuesta 200 de `GET /api/metrics/alerts` (`array` de `MetricsAlert`). |
| `CategoryEntry` / `TopCategoriesResponse` | `category`, `operation_type`, `total_amount`; array de entradas | OpenAPI schema `TopCategoryItem`; respuesta 200 de `GET /api/metrics/categories/top` (`array` de `TopCategoryItem`). |
| `MetricsSummaryItem` / `MetricsSummaryResponse` | `period`, `income`, `outcome`, `net`; array de entradas | Schema `MetricsSummaryItem`; respuesta 200 de `GET /api/metrics/summary` (`array` de `MetricsSummaryItem`). |
| `DateRangeFilter` | `start_date?`, `end_date?` | Query params opcionales `string`, `format: date` de `/api/metrics`, `/api/metrics/alerts`, `/api/metrics/categories/top` y `/api/metrics/summary`; decision 9 conserva los mismos nombres en la URL. |
| `MetricsParams` | `category?`, `operation_type?` más fechas | Query params opcionales de `GET /api/metrics`. |
| `AlertsParams` | `threshold?`, `group_by?`, `business_type?` más fechas | Query params de `GET /api/metrics/alerts`. OpenAPI fija mínimo `0`, default `0.3` y no publica máximo para `threshold`. |
| `TopCategoriesParams` | `operation_type?`, `limit?`, `business_type?` más fechas | Query params de `GET /api/metrics/categories/top`; `limit` es entero entre `1` y `20`, default `5`. |
| `MetricsSummaryParams` | `group_by?`, `category?`, `operation_type?`, `business_type?` más fechas | Query params de `GET /api/metrics/summary`. |

## Validación de compilación aislada

Comando que compiló los dos archivos de tipos, ejecutado desde el directorio `frontend/`:

```bash
npx tsc --ignoreConfig --noEmit --strict --skipLibCheck specs/api-types.ts specs/param-types.ts
```

Se usa `--ignoreConfig` porque el TypeScript local es versión 6: al indicar archivos en la línea de comandos y encontrar `frontend/tsconfig.json`, emite TS5112 si no se pide explícitamente ignorar ese archivo. Así se comprueban solo los dos archivos indicados, sin aplicar las opciones del tsconfig del frontend. La compilación terminó sin errores.

No se usa `npx tsc` desde la raíz porque el compilador `typescript` está instalado en `frontend/node_modules`, no en la raíz del repositorio. Desde la raíz, `npx` no encuentra ese binario y ofreció instalar `tsc@2.0.4`, que no es el compilador TypeScript del proyecto. Se rechazó el prompt; no se instaló ningún paquete.

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

1. ❌ **F2 pide media móvil de los 3 períodos anteriores.** La API usa `baseline_average`, que promedia los períodos previos disponibles, no una ventana de tres. **Resolución acordada en decisión 1:** mostrar `baseline_average` con la etiqueta “Promedio de períodos anteriores”, para que la columna coincida con el valor que la API usa para detectar la anomalía. El requisito original de media móvil queda pendiente de definición con PM y backend; no se modifica el backend en esta fase.
2. ❌ **El rango de threshold del PM no coincide con el límite de la API.** El PM pide `0.01` a `1.0`; OpenAPI declara `minimum: 0` y no declara máximo. En vivo, `1.01` se acepta con HTTP 200 y valores negativos reciben 422. **Resolución acordada en decisión 4:** validar en la UI `0.01 <= threshold <= 1.0` y enviar el ratio, sin asumir que el backend aplica el máximo.
3. ❌ **“Top 5” no garantiza cinco filas.** Con `operation_type=income&limit=5`, la respuesta real contiene dos categorías (`sales`, `others`); el endpoint omite categorías sin movimientos, no las rellena con cero. Facetas lista cinco categorías posibles, pero no define cuáles aplican a cada operación. **Resolución acordada en decisión 3:** mostrar solo las categorías devueltas por la API, sin completar con cero; si no devuelve ninguna, mostrar estado vacío.
4. ❌ **El PM habla de “nombre”, “ingresos” y “porcentaje”, pero esos no son los nombres del payload.** La API devuelve `category`, `total_amount` y `operation_type`; no devuelve porcentaje. **Resolución acordada en decisión 5:** mapear `category` a la etiqueta, `total_amount` al importe y calcular el porcentaje como `total_amount / ingresos_totales_del_grupo * 100`, nunca sobre la suma del top. Obtener el denominador de `/api/metrics/summary`, filtrando `operation_type=income`, fechas y `business_type`, y sumando `income`.
5. ❌ **El endpoint de categorías top no separa por sí solo los grupos.** Si se omite `business_type`, agrega B2B y B2C juntos. **Resolución en la spec:** efectuar una consulta para `business_type=B2B` y otra para `business_type=B2C`; ambos valores están confirmados por OpenAPI y por `/api/metrics/facets`.
6. ❌ **`/api/metrics` no acepta `business_type`.** Sus filtros son fechas, categoría y tipo de operación. **Resolución en la spec:** usar `business_type` en `/api/metrics/categories/top` y `/api/metrics/summary` para F3; no asumir que se puede filtrar con ese parámetro en el endpoint principal.
7. ❌ **“Período” no es una fecha uniforme.** `MetricsAlert.period` es `string`; según `group_by` devuelve mes `YYYY-MM`, día `YYYY-MM-DD` o semana ISO `YYYY-Www`. **Resolución acordada en decisión 6:** F2 usa `group_by=month` y trata `period` como etiqueta, no como fecha.
8. ❌ **Los nombres de fecha de movimientos y filtros difieren.** El movimiento usa `create_date`, mientras que los parámetros son `start_date` y `end_date`; no existe un campo de respuesta llamado `date`. **Resolución en la spec:** conservar esos identificadores exactos y mandar fechas ISO `YYYY-MM-DD`; omitir cada parámetro cuando su input esté vacío.
9. ❌ **El rango de F1 también limita el historial utilizado para el baseline de alertas.** La API filtra movimientos por rango antes de agrupar y calcular `baseline_average`. **Resolución acordada en decisión 2:** documentar este comportamiento como caso límite: rangos cortos pueden cambiar las alertas y el primer período no tiene historia previa dentro del rango.
10. ❌ **F3 pide una página nueva, pero la app solo tiene `/` y no tiene ruteo.** No hay router configurado ni otras páginas. **Resolución acordada:** decisión 8 fija `/b2b-vs-b2c`, los enlaces de navegación entre ambas páginas y la incorporación de ruteo cliente. **Estado:** cerrado para la especificación.
11. ❌ **F1 pide filtrar todos los datos de la página; ahora los KPIs y gráficos se calculan con una única respuesta.** Los cuatro KPIs (`Total Income`, `Total Outcome`, `Profit`, `Profit Margin`) se calculan en `computeKPIs(movements)` y los dos gráficos (`Income vs. Outcome`, `Profit Margin %`) se derivan de `computeMonthlyData(movements)`. Ambas funciones reciben exclusivamente los movimientos cargados por `GET /api/metrics`; no se usa otro endpoint para estas seis visualizaciones. OpenAPI confirma que `/api/metrics` acepta `start_date` y `end_date` opcionales, ambos `string` con formato `date` (`YYYY-MM-DD`); llamadas reales verificaron filtros con solo inicio, solo fin y ambos. **Resolución en la spec:** aplicar el rango seleccionado a la solicitud de `/api/metrics` y derivar de esa misma respuesta los cuatro KPIs y ambos gráficos, evitando que una visualización quede sin filtrar.
12. ❌ **El encabezado muestra un período fijo que no refleja ni el filtro ni el dataset.** Hoy `DashboardHeader` recibe `2024 - Full Year`; facetas devolvió `min_date=2025-09-02` y `max_date=2026-08-28`. **Resolución acordada en decisión 7:** sin filtro, mostrar el rango completo `min_date`–`max_date` de `/api/metrics/facets`; con filtro, mostrar el rango seleccionado.

## Preguntas resueltas

1. ✅ La media móvil se adapta a `baseline_average`; la media móvil de tres períodos queda como seguimiento de PM y backend.
2. ✅ El baseline se limita al rango de fechas; rangos cortos y el primer período sin historia previa son casos límite documentados.
3. ✅ F3 muestra solo las categorías devueltas, sin rellenar con cero; una lista vacía usa estado vacío.

No quedan preguntas abiertas que bloqueen estas especificaciones.

## Decisiones

1\. **Media móvil:** se adapta el requisito a la API. La columna muestra `baseline_average` con la etiqueta “Promedio de períodos anteriores”, para coincidir con el valor que la API utiliza al detectar anomalías. El requisito original de media móvil de tres períodos queda pendiente para PM y backend; esta fase no modifica el backend.
2\. **Baseline con rango de fechas:** se documenta el comportamiento actual: el baseline se calcula solo con los períodos que quedan dentro del rango filtrado. Es un caso límite porque rangos cortos pueden cambiar las alertas y el primer período del rango no tiene historia previa. Verificación en vivo para `2025-12-01`–`2025-12-31`, `group_by=month` y `threshold=0.01`: `/api/metrics/summary` devolvió `[{"period":"2025-12","income":68361.45,"outcome":103378.98,"net":-35017.53}]`; `/api/metrics/alerts` devolvió `[]`. Sin filtro de fechas, ese período sí aparece como alerta con `baseline_average=59573.44` e `increase_ratio=0.7353`.
3\. **Categorías F3:** mostrar solo las categorías que devuelve la API, sin rellenar con ceros; si devuelve cero categorías, mostrar estado vacío. El dataset verificado tiene solo dos categorías de ingreso: `sales` y `others`.
4\. **Threshold:** la UI valida `0.01`–`1.0`, aunque la API acepta `threshold >= 0` y no publica un máximo.
5\. **Porcentaje F3:** el denominador es el total de ingresos del grupo, sumado desde `/api/metrics/summary` con `operation_type=income`, `business_type` y fechas; no es la suma del top-5. Verificación cruzada con el rango completo: B2B, `557903.97 + 57636.75 = 615540.72`, igual al total de summary; B2C, `574193.41 + 68412.74 = 642606.15`, igual al total de summary. La igualdad ocurre porque hay solo dos categorías de ingreso.
6\. **Período de alertas F2:** usar `group_by=month` y tratar `period` como etiqueta mensual `YYYY-MM`, no como fecha.
7\. **Encabezado:** sin filtro, mostrar el rango completo de facets (`min_date`–`max_date`); con filtro, mostrar el rango seleccionado. Esta decisión cierra el desajuste 12.
8\. **Página F3 y navegación:** la página comparativa usa la ruta `/b2b-vs-b2c`. El encabezado incluye enlaces en ambas direcciones: `Resumen` → `/` y `B2B vs B2C` → `/b2b-vs-b2c`. Se requiere ruteo del lado del cliente. Revisado `frontend/package.json`: no aparece `react-router-dom` ni otra librería de ruteo entre las dependencias; incorporar una es una dependencia de implementación. No se instala ninguna librería en esta fase.
9\. **Rango de fechas compartido:** el filtro se mantiene en los query params `start_date` y `end_date`, con los nombres exactos de la API. Debe sobrevivir a la navegación entre `/` y `/b2b-vs-b2c`, a una recarga y permitir compartir la URL. Ambas páginas leen y escriben el mismo `DateRangeFilter` a partir de esos parámetros; cuando una fecha está vacía, se omite su parámetro.
10\. **Cierre del desajuste 10:** queda resuelto con la decisión 8: path, enlaces de navegación y necesidad de incorporar ruteo cliente ya están definidos.

## Cierre de fase 1

No hay un documento tipo changelog en el repositorio. Se registra el proceso aquí, junto a la verificación de contratos que sustenta las futuras especificaciones.

- Se descargó `/openapi.json` del backend en vivo y se contrastaron los contratos de `/api/metrics`, `/api/metrics/facets`, `/api/metrics/alerts`, `/api/metrics/categories/top` y `/api/metrics/summary`.
- Se probaron respuestas reales con defaults, filtros de fechas completos y parciales, rangos sin resultados y límites de `threshold`; se anotaron esquemas, valores y comportamiento observable.
- Se rastreó el frontend actual: `GET /api/metrics` alimenta los cuatro KPIs y los dos gráficos; se documentaron el layout, el fetch, la ausencia de rutas y el proxy de Vite.
- Se registraron las decisiones de ruta y navegación F3, el filtro `DateRangeFilter` compartido por URL y las discrepancias entre requisitos y contrato/comportamiento existentes.
- Durante la fase 1, el alcance se mantuvo en documentación dentro de `frontend/specs/`: no se modificaron componentes, tipos, dependencias ni backend, y no se creó ninguna spec de funcionalidad.
- Las preguntas abiertas de la fase 1 quedaron resueltas en las decisiones 1–3; el requisito original de media móvil queda como seguimiento de PM/backend.

**Estado de fase 1:** exploración y verificación documentadas; este registro se incluyó en el commit `b21351a`, publicado en `origin/feature/frontend-specs`.

**Estado actual:** los tipos de las funcionalidades están en revisión en esta fase; no se han creado specs de funcionalidad. No se ha hecho commit de estos tipos.
