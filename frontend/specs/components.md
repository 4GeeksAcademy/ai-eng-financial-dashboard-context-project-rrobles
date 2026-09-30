# Especificación de componentes

Alcance: describir componentes, props y estados para F1, F2 y F3. Es una especificación solamente; no se crean componentes React ni tipos nuevos.

Los tipos de API/parámetros se importan desde `frontend/specs/api-types.ts` y `frontend/specs/param-types.ts`. Para los datos transformados que ya consume el dashboard se reutilizan `KPIMetrics` y `MonthlyDataPoint` de `frontend/src/lib/financial-types.ts`. Los tipos nativos `string`, `number`, `boolean`, `null` y firmas de callbacks no requieren aliases nuevos.

**Precedencia de estados para todos los componentes:** error > carga > vacío > datos. Si hay error, se comunica ese error en vez de mostrar simultáneamente un vacío o datos parciales como resultado completo; mientras carga, no se muestra vacío; el estado vacío solo aplica a una respuesta válida sin elementos.

## F1: rango de fechas en el dashboard

**Ruta y composición:** `/` conserva el dashboard actual. El orden es encabezado, filtro de fechas, error de carga/validación, KPIs y dos gráficos. El rango de URL se aplica a `GET /api/metrics`; de la misma respuesta se derivan los cuatro KPIs y ambas series. Las facetas se cargan sin rango para informar los límites disponibles.

**Propietario de datos:** `DashboardPage` lee `start_date` y `end_date` de la URL, carga `GET /api/metrics/facets` y `GET /api/metrics`, construye `MetricsParams`, valida el orden de fechas y transforma `MetricsResponse` con `computeKPIs` y `computeMonthlyData`. El filtro, encabezado, fila KPI y gráficos son presentacionales y reciben props. Ningún gráfico ni KPI hace fetch.

### `App` — existente, se modifica

Se conserva como raíz de la aplicación; incorpora ruteo cliente para `/` y `/b2b-vs-b2c` y renderiza `DashboardPage` o `B2BvsB2CPage`. No carga datos.

| Prop | Tipo | Obligatoria | Descripción |
| --- | --- | --- | --- |
| Ninguna | — | — | Componente raíz sin props. |

**Estados:** las rutas conocidas renderizan su página; una ruta desconocida muestra una página/aviso de no encontrado. Los estados de carga, error y vacío de datos pertenecen a cada página, no al router.

### `DashboardPage` — nueva, página/contenedor

Propietario de las cargas de F1 y F2 en `/`: facets, movimientos, alertas y, cuando hace falta clasificar el estado vacío de alertas, summary mensual. Mantiene la sincronización del rango de URL y pasa datos y estado a los componentes visuales.

| Prop | Tipo | Obligatoria | Descripción |
| --- | --- | --- | --- |
| Ninguna | — | — | Lee el rango directamente de los query params y no recibe props de datos. |

**Estados:** carga facets y movimientos; muestra error de red si falla cualquiera. Si las fechas de URL tienen formato inválido o `start_date > end_date`, bloquea las peticiones dependientes del rango y expone error de validación; no envía un rango invertido que la API rechazaría con `422`. Una vez cargados los datos, si `MetricsResponse` está vacío muestra explícitamente “No hay movimientos en el rango seleccionado”, además de los KPIs en cero y los estados vacíos de los gráficos. Las fechas válidas fuera de `min_date`–`max_date` no se corrigen ni recortan silenciosamente: se conservan en la URL y se consultan; con solapamiento se muestran los movimientos coincidentes y sin solapamiento la API responde `[]` y se muestra el mismo mensaje de rango sin movimientos. Presenta el rango activo en el encabezado; si ambos parámetros están vacíos, usa `min_date`–`max_date` de facets.

### `DashboardHeader` — existente, se modifica

Mantiene título y período, agrega navegación entre Resumen y B2B vs B2C según la decisión 8 de [verification.md](verification.md). No carga datos; recibe el texto de período ya resuelto por la página.

| Prop | Tipo | Obligatoria | Descripción |
| --- | --- | --- | --- |
| `period` | `string` | Sí, obligatoria | Rango seleccionado o `min_date`–`max_date` de facets si no hay filtros. La página calcula y pasa este texto; `DashboardHeader` ya no usa un default. |

**Estados:** el encabezado y los enlaces se muestran durante carga, error, datos y vacío; si facets falla antes de poder construir el rango completo, conserva un placeholder de período y el error se comunica en el contenido de la página.

### `DateRangeFilterControl` — nuevo, control compartido

Control presentacional reutilizado en `/` y `/b2b-vs-b2c`. El dueño de cada página lee/escribe `start_date` y `end_date` en el query string; el control no hace fetch.

| Prop | Tipo | Obligatoria | Descripción |
| --- | --- | --- | --- |
| `value` | `DateRangeFilter` (`param-types.ts`) | Sí | Valores actuales de `start_date` y `end_date`; cada propiedad puede omitirse. |
| `facets` | `FacetsResponse \| null` (`api-types.ts`) | Sí | `min_date`/`max_date` para indicar el rango disponible y establecer límites sugeridos de los inputs. `null` mientras no haya respuesta. |
| `loading` | `boolean` | Sí | Indica carga inicial de facets. |
| `error` | `string \| null` | Sí | Error de carga de facets. |
| `validationError` | `string \| null` | Sí | Error de fechas inválidas o invertidas; se muestra junto a los inputs. |
| `onChange` | `(value: DateRangeFilter) => void` | Sí | Notifica el rango editado para que la página actualice la URL y vuelva a consultar. |

**Entrada y estados:** renderiza ambos controles como `input type="date"`, que entrega fechas completas `YYYY-MM-DD`. Durante carga muestra controles deshabilitados o skeleton; ante error explica que no se pudo obtener el rango disponible; con facets muestra las dos fechas y el rango disponible. Un solo límite es válido y solo se escribe su query param; si `start_date = end_date`, es un rango inclusivo válido de un día y se envían ambos parámetros. Con ambos vacíos se eliminan ambos parámetros. Si el inicio supera el fin, muestra error junto al filtro y no se consulta la API. Las fechas válidas fuera de facets se aceptan y se notifican como fuera del rango disponible; no se recortan: un rango sin intersección da estado vacío en los datos.

### `KPIRow` — existente, se modifica solo para propagar rango/error si hace falta

Presenta cuatro instancias de `KPICard`; no calcula KPIs ni carga datos.

| Prop | Tipo | Obligatoria | Descripción |
| --- | --- | --- | --- |
| `metrics` | `KPIMetrics \| null` (`src/lib/financial-types.ts`) | Sí | Totales calculados por `DashboardPage`; `null` antes de datos válidos. |
| `loading` | `boolean` | No, existente en `KPIRowProps` | Controla skeletons durante la carga. |

**Estados:** `metrics` es `null` solo antes de completar la primera carga y se muestra skeleton cuando `loading`. Tras una respuesta válida con cero movimientos, `DashboardPage` pasa los cuatro valores en cero y acompaña las tarjetas con “No hay movimientos en el rango seleccionado”; esa distinción entre carga inicial y rango sin movimientos es responsabilidad de `DashboardPage`. Los errores se muestran en el aviso de la página, no se repiten aquí.

### `KPICard` — existente, sin cambio funcional

Componente visual interno de `KPIRow`; recibe valores ya formateados y nunca carga ni calcula métricas.

| Prop | Tipo | Obligatoria | Descripción |
| --- | --- | --- | --- |
| `label` | `string` | Sí | Etiqueta, actualmente Total Income, Total Outcome, Profit o Profit Margin. |
| `value` | `string` | Sí | Valor ya formateado por la fila KPI. |
| `helperText` | `string` | Sí, prop existente | Texto de apoyo existente y obligatorio en `KPICardProps`. |
| `icon` | `LucideIcon` (`lucide-react`) | Sí | Icono de la tarjeta. |
| `variant` | `'income' \| 'outcome' \| 'profit' \| 'profitPercent'` | Sí | Variante visual existente. |
| `loading` | `boolean` | No | Muestra el skeleton de tarjeta. |

**Estados:** skeleton cuando carga; valor y textos cuando hay datos; si la API devuelve lista vacía, recibe el valor cero de `KPIRow`. Cuando `totalIncome` es cero, `computeKPIs` asigna `profitPercent = 0` en lugar de dividir; la tarjeta Profit Margin muestra `0.0%` mediante `formatPercent`, nunca `NaN` ni `Infinity`. Un margen negativo es válido y conserva su signo al formatear (por ejemplo, `-5.3%`). Error y mensaje de rango sin movimientos se comunican fuera de la tarjeta.

### `IncomeOutcomeChart` — existente, sin cambio funcional

Gráfico mensual de ingresos y egresos. Solo recibe la serie transformada.

| Prop | Tipo | Obligatoria | Descripción |
| --- | --- | --- | --- |
| `data` | `MonthlyDataPoint[]` (`src/lib/financial-types.ts`) | Sí | Serie mensual derivada por `DashboardPage` desde los movimientos filtrados. |
| `loading` | `boolean` | No, existente | Controla skeleton del gráfico. |

**Estados:** skeleton durante carga; líneas cuando existen puntos con ingresos o egresos; con `[]` o puntos sin valores muestra “No data available to display”. El error general se presenta en la página.

### `ProfitPercentChart` — existente, sin cambio funcional

Gráfico mensual del margen calculado sobre la misma serie filtrada que usa el otro gráfico.

| Prop | Tipo | Obligatoria | Descripción |
| --- | --- | --- | --- |
| `data` | `MonthlyDataPoint[]` (`src/lib/financial-types.ts`) | Sí | Serie mensual derivada por `DashboardPage`. |
| `loading` | `boolean` | No, existente | Controla skeleton del gráfico. |

**Estados:** skeleton durante carga; línea cuando hay un margen distinto de cero; si no hay datos o todos los márgenes son cero muestra “No data available to display”. El error general se presenta en la página.

## F2: alertas de anomalías

**Ubicación:** inmediatamente después de los dos gráficos de F1. Se mantiene visible la estructura de la sección y los encabezados de tabla incluso cuando no hay filas.

**Propietario de datos:** al montar `/`, `DashboardPage` consulta automáticamente `GET /api/metrics/alerts` con threshold inicial `0.3`, `group_by=month` y el `DateRangeFilter` actual. También vuelve a consultar al confirmar otro threshold válido en el input, no con cada tecla. Si la respuesta de alertas es `[]`, consulta `GET /api/metrics/summary` con el mismo rango y agrupación para distinguir cero períodos, un solo período sin historia previa y períodos suficientes sin anomalías. `AlertsSection` no hace fetch.

### `AlertsSection` — nuevo, presentacional

Contiene el input de umbral, validación, tabla y estados vacíos; se monta bajo los gráficos.

| Prop | Tipo | Obligatoria | Descripción |
| --- | --- | --- | --- |
| `thresholdValue` | `string` | Sí | Texto del input para permitir estados intermedios de edición; el padre solo crea `AlertsParams.threshold` al poder parsear un número válido. |
| `alerts` | `AlertsResponse \| null` (`api-types.ts`) | Sí | `null` antes/después de una consulta no válida; `[]` indica respuesta válida sin anomalías; array contiene filas. |
| `periods` | `MetricsSummaryResponse \| null` (`api-types.ts`) | Sí | Summary del rango, requerido para clasificar una respuesta vacía: cero, un período o varios. `null` mientras se carga o si no fue solicitado. |
| `loading` | `boolean` | Sí | Carga de alertas y, si aplica, summary para clasificar el vacío. |
| `error` | `string \| null` | Sí | Error de red en alertas o summary. |
| `validationError` | `string \| null` | Sí | Para valor vacío, no numérico o fuera del intervalo, muestra junto al input exactamente “Ingresa un valor entre 0.01 y 1.0”. |
| `onThresholdCommit` | `(value: string) => void` | Sí | Confirma el valor al perder el foco o presionar Enter; no solicita datos en cada tecla. |

**Estados:** una vez confirmado el threshold válido, carga con skeleton de tabla; error de API con mensaje de reintento; datos con columnas Período, Outcome registrado, Promedio de períodos anteriores e Incremento. Los montos se formatean con `formatCurrency` de `financial-utils.ts`, igual que los KPIs (`USD`, locale `en-US`, sin decimales). `formatPercent(value)` espera puntos porcentuales: aplica `value.toFixed(1)` y añade `%`, no interpreta el valor como ratio; por eso la razón de la API se presenta con `formatPercent(increase_ratio * 100)` (por ejemplo `0.7353` → `73.5%`). Si `alerts=[]`, se conservan la tabla y sus encabezados: con `periods.length === 0`, informa que no hay movimientos en el rango; con `periods.length === 1`, informa que el rango es demasiado corto y no hay un período anterior para comparar; con dos o más períodos, informa “No hay anomalías con este umbral”. Si el valor confirmado está vacío, no es numérico o queda fuera de `0.01`–`1.0`, no se consulta alerts, se invalida/limpia la respuesta anterior y se muestra el mensaje único junto al input. La API publica `threshold >= 0` sin máximo, pero la interfaz aplica la decisión 4 de [verification.md](verification.md).

## F3: comparativa B2B vs B2C

**Ruta y ubicación:** `/b2b-vs-b2c`, con navegación desde el encabezado compartido. El control de rango usa los mismos query params y componente que F1. Debajo se muestran dos paneles en paralelo; bajo ambos, un solo gráfico comparativo de ingresos.

**Propietario de datos:** `B2BvsB2CPage` carga explícitamente `GET /api/metrics/facets` para proporcionar el rango disponible al filtro compartido. Por cada `BusinessType` carga `GET /api/metrics/categories/top` con `operation_type=income`, `limit=5` y el rango activo, además de `GET /api/metrics/summary` con `operation_type=income`, `group_by=month` explícito, `business_type` y el mismo rango. Suma `income` de los elementos del summary fuera del render para obtener el total del grupo. Inicia las cargas de ambos grupos en paralelo y conserva estados independientes por grupo (equivalente a `Promise.allSettled`): un error en B2B no oculta una tabla B2C correcta ni viceversa. El gráfico espera ambos totales; si falla uno, comunica que no puede comparar ambos grupos sin ocultar el panel que sí cargó.

### `B2BvsB2CPage` — nueva, página/contenedor

| Prop | Tipo | Obligatoria | Descripción |
| --- | --- | --- | --- |
| Ninguna | — | — | Lee el `DateRangeFilter` de la URL; carga facets, tablas y totales de ambos grupos. |

**Estados:** facets loading/error se presenta en el filtro compartido. Cada carga de grupo se administra por separado; muestra los dos paneles y el gráfico mientras se resuelven. Con respuesta completa muestra ambos paneles y el total comparativo. Error de una consulta conserva el grupo que sí tuvo datos; error de ambas muestra errores en ambos paneles. Rangos sin resultados producen paneles vacíos y gráfico con ambos totales en cero.

### `BusinessCategoryPanel` — nuevo, dos instancias presentacionales

Un panel para B2B y otro para B2C, ambos colocados en paralelo. No hace fetch ni suma ingresos. Renderiza las categorías recibidas; no rellena filas con cero, conforme a la decisión 3 de [verification.md](verification.md).

| Prop | Tipo | Obligatoria | Descripción |
| --- | --- | --- | --- |
| `businessType` | `BusinessType` (`api-types.ts`) | Sí | Identifica el título B2B o B2C. |
| `categories` | `CategoryEntry[]` (`api-types.ts`) | Sí | Categorías de ingreso recibidas de `GET /api/metrics/categories/top`; se usa el array vacío cuando la respuesta no contiene categorías. |
| `groupTotal` | `number \| null` | Sí | Total de ingresos del grupo, calculado desde `MetricsSummaryResponse` según la decisión 5 de [verification.md](verification.md); `null` significa que el summary falló y el total es desconocido. |
| `loading` | `boolean` | Sí | Carga de las consultas del grupo. |
| `error` | `string \| null` | Sí | Error de carga del grupo; no afecta al panel hermano. |

**Estados:** skeleton durante carga; filas con categoría, `total_amount` formateado con el `formatCurrency` común y porcentaje `total_amount / groupTotal * 100`; si hay menos de cinco categorías, muestra solo las recibidas; con `categories=[]`, mantiene el panel/encabezado y muestra estado vacío. Si `groupTotal=0`, muestra `—` en el porcentaje y nunca evalúa la división, por lo que no presenta `NaN` ni `Infinity`. Si `groupTotal=null`, summary falló: el panel muestra su estado de error aunque categories haya respondido. Ante error de categorías se muestra error en el panel.

### `IncomeComparisonChart` — nuevo, presentacional

Un gráfico que compara un solo total de ingresos B2B frente a B2C; no hace fetch ni agrega periodos.

| Prop | Tipo | Obligatoria | Descripción |
| --- | --- | --- | --- |
| `b2bTotalIncome` | `number \| null` | Sí | Suma de `income` mensual de summary B2B; `null` hasta respuesta. |
| `b2cTotalIncome` | `number \| null` | Sí | Suma de `income` mensual de summary B2C; `null` hasta respuesta. |
| `loading` | `boolean` | Sí | Espera a ambos totales para que la comparación sea coherente. |
| `error` | `string \| null` | Sí | Error si falta cualquiera de los dos totales. |

**Estados:** skeleton hasta tener ambos totales; gráfico con dos barras/valores cuando ambos estén disponibles; si un grupo totaliza cero, muestra su barra de altura cero desde la línea base y etiqueta `$0` para que el grupo siga presente; error de un total muestra mensaje de comparación no disponible. Dos totales cero se muestran como datos válidos, no como error ni como ausencia de respuesta.

## Decisiones y supuestos

- ✅ El propietario de cada carga es una página/contenedor (`DashboardPage` o `B2BvsB2CPage`); `DateRangeFilterControl`, `DashboardHeader`, `KPIRow`, tarjetas, gráficos, `AlertsSection` y `BusinessCategoryPanel` reciben props y no llaman a la API. Sigue la regla `frontend-data-flow`.
- ✅ Las reglas cerradas de ruta, navegación, query params compartidos, threshold, baseline, categorías y porcentaje remiten a [verification.md](verification.md), decisiones 1–9. En particular F2 usa `group_by=month` y el período se trata como etiqueta.
- ✅ Los importes de alertas/paneles reutilizan `formatCurrency`; `increase_ratio` se multiplica por 100 antes de `formatPercent`.
- ✅ Fechas invertidas se bloquean antes de consultar; una fecha sola se envía sola; fechas ISO válidas fuera de facets se conservan sin recorte silencioso. Un rango sin intersección con los datos produce estados vacíos de API, no un error de contrato.
- ✅ El vacío de alertas distingue sin movimientos, un solo período sin historia y varios períodos sin anomalías; para ello se consulta summary solo cuando la lista de alertas está vacía.
- ✅ Los grupos B2B/B2C se cargan en paralelo con estados independientes; la comparación espera ambos totales. Un error de un grupo no bloquea la tabla válida del otro.
- ✅ `BusinessCategoryPanel` recibe `CategoryEntry[]` y `groupTotal`; calcula `total_amount / groupTotal * 100` y muestra `—` si `groupTotal` es cero. No se requiere callback ni tipo de fila derivada.
- ✅ Si el rango de F1 no contiene movimientos, `DashboardPage` informa “No hay movimientos en el rango seleccionado” además de mostrar los KPIs en cero y los gráficos vacíos. Cuando `totalIncome` es cero, `computeKPIs` produce `profitPercent = 0`, que la tarjeta presenta como `0.0%`.
- ✅ Para todos los componentes rige una única precedencia: error > carga > vacío > datos.
- ✅ `KPICard.helperText` es prop obligatoria existente; `KPIRow.loading` es prop opcional existente.
- ✅ `DashboardPage` carga alerts al montar con threshold inicial `0.3`; el input confirma cambios al blur o Enter. El error de validación es siempre “Ingresa un valor entre 0.01 y 1.0”.
- ✅ Los inputs de fecha son `type="date"`; fechas iguales forman un rango inclusivo de un día y se envían ambos parámetros. F3 incluye facets y manda `group_by=month` explícito en ambos summaries.
- ✅ `formatPercent` espera puntos porcentuales y solo aplica `toFixed(1)` antes de añadir `%`; para `increase_ratio` se multiplica por 100. Los valores negativos se presentan con signo.
- ❓ `KPIMetrics` y `MonthlyDataPoint` no viven en `frontend/specs/api-types.ts`; ya existen en `frontend/src/lib/financial-types.ts` y se reutilizan tal cual. No faltan tipos para las props descritas; los estados y callbacks usan tipos nativos. La dependencia de router sigue pendiente de instalación según `verification.md`, decisión 8.
