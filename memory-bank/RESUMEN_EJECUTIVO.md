# Prompt: versión ejecutiva del proyecto Financial Metrics Dashboard

## 1. Resumen ejecutivo

El proyecto Financial Metrics Dashboard es una solución de analítica financiera orientada a la visualización de rendimiento operativo, diseñada como un panel web con backend y frontend desacoplados. Su propósito es permitir a usuarios no técnicos y a equipos de negocio consultar de forma rápida indicadores clave de ingresos, egresos, rentabilidad y alertas de variación financiera.

La solución combina:

- un backend en FastAPI que expone servicios para consultar movimientos financieros simulados,
- un frontend en React + TypeScript que consume esos servicios y presenta la información en gráficos y KPIs,
- un conjunto de reglas de negocio para filtrar, agrupar y comparar información por periodo, categoría y tipo de negocio.

## 2. Funcionalidad principal

### 2.1 Visualización de KPIs
El usuario puede ver, desde la interfaz:

- ingresos totales
- egresos totales
- beneficio neto
- porcentaje de rentabilidad

Estos cálculos se realizan en el frontend sobre la respuesta de la API, permitiendo una experiencia de análisis rápida y amigable.

### 2.2 Comparación por periodos
El sistema compara el periodo actual con el anterior y calcula:

- diferencia absoluta
- porcentaje de variación
- valor neto del periodo actual y anterior

Esto ayuda a detectar crecimiento o deterioro financiero entre intervalos de tiempo.

### 2.3 Agrupación por día, semana y mes
La API permite resumir ingresos y egresos por:

- día
- semana
- mes

Esto facilita la lectura del desempeño financiero en diferentes granularidades temporales.

### 2.4 Alertas de incumplimiento o aumento de gastos
La API detecta periodos donde los egresos aumentan por encima de una línea base histórica. Esto permite identificar riesgos operativos o cambios bruscos en costos.

### 2.5 Segmentación B2B y B2C
La aplicación distingue movimientos según el tipo de negocio:

- B2B
- B2C

Esto permite comparar cómo se comporta cada canal comercial y analizar mejor la estructura de ingresos y egresos.

### 2.6 Filtros de negocio
El usuario puede filtrar la información por:

- fecha inicial y final
- tipo de operación: income / outcome
- categoría: sales, suppliers, operational, administrative, others
- negocio: B2B / B2C

## 3. Cómo conecta la solución para realizar tareas

La arquitectura del sistema se comunica en este flujo:

1. El usuario entra a la interfaz web en el frontend.
2. El frontend solicita datos al backend a través de endpoints REST.
3. El backend genera movimientos financieros simulados con un conjunto de atributos estructurados.
4. El backend aplica filtros, resúmenes, comparaciones y alertas según los parámetros recibidos.
5. El frontend recibe la respuesta JSON y transforma esos datos para mostrarlos como KPI, gráficos y comparativas.
6. La visualización se presenta de forma clara para que el usuario pueda decidir sobre tendencias, riesgos o rendimiento financiero.

### Conexión funcional principal

- Frontend: [frontend/src/App.tsx](../frontend/src/App.tsx)
- Lógica de cálculo: [frontend/src/lib/financial-utils.ts](../frontend/src/lib/financial-utils.ts)
- Tipos de datos: [frontend/src/lib/financial-types.ts](../frontend/src/lib/financial-types.ts)
- API REST: [backend/app/routes.py](../backend/app/routes.py)
- Arranque de FastAPI: [backend/app/main.py](../backend/app/main.py)

## 4. Cómo ejecutar cada funcionalidad desde el punto de vista del usuario

### 4.1 Iniciar el sistema
Desde la raíz del proyecto:

```bash
docker compose up --build
```

Esto levanta:

- frontend en http://localhost:5173
- backend en http://localhost:8000
- documentación Swagger en http://localhost:8000/docs

### 4.2 Ver el dashboard
El usuario abre el navegador en:

- http://localhost:5173

Una vez cargado, la aplicación solicita automáticamente la información financiera al backend y presenta los indicadores principales.

### 4.3 Consultar información detallada
El usuario puede navegar o usar la API directamente para consultar:

- movimientos financieros completos
- resumen por periodo
- top categorías de gasto o ingreso
- comparación entre periodos
- alertas de riesgo

Esto se hace desde la API o desde la capa visual que consume los mismos servicios.

### 4.4 Aplicar filtros
Desde la API, el usuario puede filtrar mediante parámetros como:

- start_date
- end_date
- category
- operation_type
- business_type

Ejemplo:

```bash
curl "http://localhost:8000/api/metrics?start_date=2025-09-01&end_date=2025-09-30&operation_type=income"
```

### 4.5 Consultar métricas resumidas
Ejemplo:

```bash
curl "http://localhost:8000/api/metrics/summary?group_by=month"
```

### 4.6 Ver las categorías más relevantes
Ejemplo:

```bash
curl "http://localhost:8000/api/metrics/categories/top?operation_type=outcome&limit=3"
```

### 4.7 Revisar alertas de gasto
Ejemplo:

```bash
curl "http://localhost:8000/api/metrics/alerts?threshold=0.2&group_by=month"
```

### 4.8 Revisar segmentos B2B y B2C
Ejemplo:

```bash
curl "http://localhost:8000/api/metrics/b2b"
curl "http://localhost:8000/api/metrics/b2c"
```

## 5. Servicios y funcionamiento principal de la API

La API dispone de los siguientes servicios:

| Endpoint | Función |
| --- | --- |
| /health | Verifica que el servicio esté activo |
| /api/metrics | Devuelve movimientos financieros con filtros |
| /api/metrics/facets | Devuelve filtros y rango de fechas disponibles |
| /api/metrics/summary | Resume ingresos y egresos por periodo |
| /api/metrics/categories/top | Devuelve top categorías por operación |
| /api/metrics/comparison | Compara el neto del periodo actual vs anterior |
| /api/metrics/alerts | Detecta alertas de incremento de gasto |
| /api/metrics/b2b | Filtra movimientos B2B |
| /api/metrics/b2c | Filtra movimientos B2C |

## 6. Evidencia ejecutiva verificada

### 6.1 Pruebas del backend
Se ejecutó el siguiente comando:

```bash
cd /workspaces/ai-eng-financial-dashboard-context-project-rrobles/backend && pytest -q
```

Resultado verificado:

```text
15 passed, 1 warning in 0.54s
```

### 6.2 Validación real de endpoints
Se ejecutaron las rutas reales con FastAPI TestClient y se obtuvieron estas respuestas verificadas:

- /health → status 200 → {"status": "ok"}
- /api/metrics → status 200 → 360 registros
- /api/metrics/facets → status 200 → claves: business_types, categories, max_date, min_date, operation_types
- /api/metrics/summary → status 200 → 12 registros agregados por mes
- /api/metrics/categories/top → status 200 → 3 registros con totales por categoría
- /api/metrics/comparison → status 200 → valores de current_period, previous_period, delta_abs y delta_pct
- /api/metrics/alerts → status 200 → lista de alertas con 4 elementos
- /api/metrics/b2b → status 200 → 203 registros
- /api/metrics/b2c → status 200 → 157 registros

## 7. Conclusión ejecutiva

El proyecto resuelve de forma clara y operativa la necesidad de monitorear la salud financiera de un negocio mediante un panel analítico fácil de interpretar. Su valor principal no radica solo en la visualización, sino en la conexión entre la capa de datos, la lógica financiera y la experiencia del usuario final.

Desde la perspectiva del usuario, el flujo es simple: inicia la aplicación, observa el dashboard, interpreta indicadores y usa filtros o consultas de la API para profundizar en segmentos o periodos específicos. La solución está lista para uso demo, validación funcional y ampliación con datos reales.
