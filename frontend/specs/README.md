# Contrato de datos de las funcionalidades

Este directorio especifica el contrato de datos y la experiencia esperada para F1, F2 y F3. El alcance es solo frontend: describe peticiones, respuestas y comportamiento de UI; no implementa componentes ni modifica el backend.

Convención: ✅ verificado en OpenAPI o en una respuesta HTTP real; ❌ desajuste con el requisito original y su resolución acordada; ❓ sin verificar.

## Índice

| Archivo | Contenido |
| --- | --- |
| [README.md](README.md) | Contrato de datos y casos límite de F1, F2 y F3. |
| [api-types.ts](api-types.ts) | Tipos de respuestas verificados. |
| [param-types.ts](param-types.ts) | Tipos de query params y rango compartido en URL. |
| [components.md](components.md) | Responsabilidad, props y estados de los componentes. |
| [verification.md](verification.md) | Evidencia OpenAPI/HTTP, decisiones y trazabilidad de tipos. |

## F1: rango de fechas del dashboard

### Endpoints y tipos F1

| Método y ruta | Petición | Respuesta |
| --- | --- | --- |
| `GET /api/metrics/facets` | Sin query params. | `FacetsResponse` (`api-types.ts`): categorías, tipos y límites `min_date`/`max_date` en `YYYY-MM-DD`. |
| `GET /api/metrics` | `MetricsParams` (`param-types.ts`), que extiende `DateRangeFilter`. | `MetricsResponse` (`api-types.ts`), array de movimientos `FinancialMovement`; cada fecha es `create_date`. El filtro no cambia el schema de respuesta. |

Ambos endpoints son `GET` y no reciben body. En `/api/metrics`, `start_date` y `end_date` son opcionales, formato `YYYY-MM-DD`; `input type="date"` emite fechas completas. Se puede enviar solo uno; si `start_date = end_date`, es un rango inclusivo válido de un día y se envían ambos. `category` acepta `suppliers`, `sales`, `operational`, `administrative`, `others`; `operation_type` acepta `income` u `outcome`. F1 usa el rango de fechas; facets no acepta parámetros y provee el rango disponible para el encabezado y el filtro.

### UI F1

Según [components.md](components.md), `DashboardPage` es dueño de las cargas de facets y movimientos. Aplica el mismo rango de URL a `GET /api/metrics`, y de esa única respuesta deriva los cuatro KPIs (`Total Income`, `Total Outcome`, `Profit`, `Profit Margin`) y los dos gráficos mensuales. `DashboardHeader`, `DateRangeFilterControl`, `KPIRow` y ambos gráficos reciben props, no hacen fetch. Si no hay movimientos, la página muestra “No hay movimientos en el rango seleccionado” además de KPIs en cero y gráficos vacíos; `computeKPIs` devuelve Profit Margin `0` cuando income es cero, presentado como `0.0%` y nunca como `NaN`/`Infinity`.

### Casos límite F1

| Entrada | Comportamiento esperado en UI | Verificación |
| --- | --- | --- |
| Solo `start_date=2026-01-01`, sin `end_date`. | Mantener únicamente el query param de inicio; aplicar el límite inferior a todos los KPIs y ambos gráficos. No exigir un par de fechas. | ✅ `GET /api/metrics?start_date=2026-01-01` respondió `200` con 240 movimientos; [verification.md](verification.md), respuestas de ejemplo. |
| Solo `end_date=2025-12-31`, sin `start_date`. | Mantener únicamente el query param de fin y aplicar el límite superior a todos los datos de la página. | ✅ `GET /api/metrics?end_date=2025-12-31` respondió `200` con 120 movimientos; [verification.md](verification.md), respuestas de ejemplo. |
| `start_date=2025-12-31` y `end_date=2025-12-31`. | Aceptar el día como rango inclusivo válido y enviar ambos parámetros completos. | ✅ La API solo rechaza si `start_date > end_date`; igualdad no activa la validación. Inputs `type="date"` y envío de ambos params están definidos en [components.md](components.md). |
| `start_date=2026-01-31` y `end_date=2026-01-01`. | Detectar inicio posterior al fin, mostrar el error junto al filtro y no consultar `/api/metrics`; así se evita el `422` del backend. | ✅ La llamada invertida real a `/api/metrics` respondió `422`; el bloqueo previo a la petición es el comportamiento UI acordado en [components.md](components.md). |
| `start_date=1900-01-01` y `end_date=1900-01-31`, sin intersección con facets. | No cambiar silenciosamente las fechas. Mostrar “No hay movimientos en el rango seleccionado”, KPIs en cero y estados vacíos de gráficos. | ✅ La API respondió `200` con `[]`; el mensaje y presentación están especificados en [components.md](components.md). |

## F2: alertas de anomalías

### Endpoints y tipos F2

| Método y ruta | Petición | Respuesta |
| --- | --- | --- |
| `GET /api/metrics/alerts` | `AlertsParams` (`param-types.ts`), que extiende `DateRangeFilter`. | `AlertsResponse` (`api-types.ts`), array de `AlertEntry`. |
| `GET /api/metrics/summary` | `MetricsSummaryParams` (`param-types.ts`), solo cuando la respuesta de alertas está vacía y se necesita clasificar el estado vacío. Se usa `group_by=month` y el mismo rango. | `MetricsSummaryResponse` (`api-types.ts`), usado para contar períodos del rango. |

`threshold` es number, opcional, default `0.3`; OpenAPI declara mínimo `0` y no publica máximo. `group_by` acepta `day`, `week` o `month`, default `month`. `start_date`/`end_date` son opcionales, formato `YYYY-MM-DD`; `business_type` acepta `B2B` o `B2C`. Al montar la página, se consulta automáticamente con `threshold=0.3`; cambios posteriores se validan al perder el foco o presionar Enter, no con cada tecla. La UI aplica el rango `0.01`–`1.0` y, si es inválido, no consulta y muestra “Ingresa un valor entre 0.01 y 1.0”. Los campos de alerta incluyen `period`, `outcome_total`, `baseline_average` e `increase_ratio`; `period` es etiqueta mensual `YYYY-MM` con la granularidad elegida para F2.

### UI F2

`DashboardPage` es dueño de las peticiones y valida el umbral antes de llamar a la API. [components.md](components.md) ubica `AlertsSection` debajo de los gráficos. La sección mantiene la tabla y sus encabezados al quedar vacía, y presenta montos con `formatCurrency`. `formatPercent(value)` recibe puntos porcentuales: aplica `value.toFixed(1)` y añade `%`, no interpreta el valor como ratio; por eso `increase_ratio` se multiplica por 100 antes de formatearlo (por ejemplo `0.7353` → `73.5%`). Los valores negativos conservan el signo.

### Casos límite F2

| Entrada | Comportamiento esperado en UI | Verificación |
| --- | --- | --- |
| `threshold=1.01`, fuera del rango UI; el backend acepta el valor. | No enviar la petición de alertas; mostrar error junto al input y no presentar resultados anteriores como si correspondieran a ese umbral. | ✅ En vivo, `GET /api/metrics/alerts?threshold=1.01` respondió `200` (con `[]` en ese dataset); el rechazo local sin llamada es la regla UI de [components.md](components.md). |
| Al montar la página, sin interacción previa con el input. | Consultar alertas automáticamente con el default `threshold=0.3`; cambios del usuario solo se aplican al blur o Enter. | ✅ El default `0.3` está en OpenAPI; cuándo disparar la carga es decisión de interfaz registrada en [components.md](components.md). |
| Rango `2025-12-01`–`2025-12-31`, `group_by=month`, `threshold=0.01`. | Si summary tiene un solo período y alerts no tiene filas, conservar la tabla y mostrar el mensaje de rango demasiado corto/sin historia previa, no el mensaje de “no hay anomalías”. | ✅ Summary devolvió el único período `2025-12` con `outcome=103378.98`, mientras alerts devolvió `[]`. Sin rango, diciembre sí aparece como alerta con `baseline_average=59573.44` e `increase_ratio=0.7353`; ver [verification.md](verification.md), decisión 2. |
| Rango sin movimientos, por ejemplo `1900-01-01`–`1900-01-31`. | Mantener la tabla y mostrar que no hay movimientos en el rango; no confundirlo con un rango con períodos suficientes y cero anomalías. | ✅ El endpoint alerts respondió `200` con `[]` para el rango sin resultados; [verification.md](verification.md), respuestas de ejemplo. |

## F3: comparativa B2B vs B2C

### Endpoints y tipos F3

| Método y ruta | Petición | Respuesta |
| --- | --- | --- |
| `GET /api/metrics/facets` | Sin query params; la página lo solicita explícitamente al montar. | `FacetsResponse` (`api-types.ts`); aporta `categories` y el rango disponible para el filtro. |
| `GET /api/metrics/categories/top` | Dos peticiones, una por grupo, con `TopCategoriesParams` (`param-types.ts`): `operation_type=income`, `limit=5`, `business_type=B2B` o `B2C` y las fechas activas. | `TopCategoriesResponse` (`api-types.ts`), array de `CategoryEntry`; no garantiza cinco elementos. |
| `GET /api/metrics/summary` | Dos peticiones, una por grupo, con `MetricsSummaryParams` (`param-types.ts`): `operation_type=income`, `business_type=B2B` o `B2C`, fechas activas y `group_by=month` enviado explícitamente. | `MetricsSummaryResponse` (`api-types.ts`), array de `MetricsSummaryItem`; se suman sus campos `income` para el total de cada grupo. |

`business_type` acepta `B2B` o `B2C`; `operation_type` acepta `income` u `outcome`; `limit` es entero `1`–`20`, default `5`; fechas opcionales son `YYYY-MM-DD`. `group_by` acepta `day`, `week` o `month`, default `month`; para ambos summaries F3 se envía explícitamente `group_by=month`. Facets no recibe query params y se carga de forma explícita para el rango disponible. Todos los endpoints usan `GET`, sin body.

### UI F3

[components.md](components.md) define la ruta `/b2b-vs-b2c`, navegación compartida y dos `BusinessCategoryPanel` con cargas independientes, seguidos por un único `IncomeComparisonChart`. Cada panel muestra solo las categorías devueltas. Su porcentaje es `total_amount / groupTotal * 100`; si `groupTotal` es cero muestra `—`. El gráfico representa un grupo con total cero con barra de altura cero y etiqueta `$0`.

### Casos límite F3

| Entrada | Comportamiento esperado en UI | Verificación |
| --- | --- | --- |
| `operation_type=income&limit=5`, sin filtro de grupo. | Mostrar solo las filas recibidas, no completar categorías ausentes con ceros; el límite es máximo, no garantía de cinco. | ✅ La respuesta real tuvo dos categorías de ingreso: `sales` y `others`; [verification.md](verification.md), respuestas de ejemplo. |
| `business_type=B2B` o `B2C`, rango sin movimientos. | La tabla del grupo conserva su encabezado y muestra estado vacío; el total es cero. En el gráfico aparece la barra `$0`; los porcentajes no se dividen por cero. | ✅ Top y summary responden `200` con arrays vacíos para un rango sin datos. Los estados de tabla y gráfico están acordados en [components.md](components.md). |
| Total de summary igual a cero. | Mantener el grupo en la comparación con total `$0`; para cualquier fila recibida, mostrar `—` como porcentaje y nunca `NaN`/`Infinity`. | ✅ Comportamiento de presentación definido en [components.md](components.md); la operación evita división por cero. |

## Desajustes PM vs API resueltos

- ❌ El PM pidió media móvil de tres períodos; la API calcula `baseline_average` sobre períodos previos del rango. Se muestra con la etiqueta “Promedio de períodos anteriores”; cambiar el cálculo queda fuera del alcance frontend.
- ❌ El PM pidió `threshold` entre `0.01` y `1.0`; la API acepta valores desde `0` sin máximo publicado. La UI valida el rango más estrecho antes de consultar.
- ❌ “Top 5” no asegura cinco categorías; la UI muestra solo resultados reales, sin rellenar con ceros.
- ❌ El payload usa `category`/`total_amount` y no trae porcentaje; la UI calcula la participación sobre el total `income` del grupo obtenido en summary, no sobre la suma del top.
- ❌ B2B/B2C se expresa con `business_type`; `period` depende de `group_by`; fechas del movimiento se llaman `create_date` y los filtros `start_date`/`end_date`. El frontend conserva los nombres y formatos de OpenAPI.
- ✅ `formatPercent` recibe puntos porcentuales (`toFixed(1)` + `%`), no un ratio para `Intl.NumberFormat`; `increase_ratio` se multiplica por 100 antes de formatearlo.
- ✅ `KPICard.helperText` existe y es obligatorio; `KPIRow.loading` existe y es opcional. La precedencia de estados se define en [components.md](components.md): error > carga > vacío > datos.

## Compilación aislada de tipos

Desde `frontend/`, el comando documentado y verificado es:

```bash
npx tsc --ignoreConfig --noEmit --strict --skipLibCheck specs/api-types.ts specs/param-types.ts
```

`--ignoreConfig` es necesario con TypeScript 6 cuando se indican archivos explícitos y se quiere excluir `tsconfig.json`. No ejecutar `npx tsc` desde la raíz: ahí `npx` no encuentra el compilador local y ofreció instalar `tsc@2.0.4` en vez de usar el TypeScript del frontend; no se instaló ese paquete. Más detalles en [verification.md](verification.md).
