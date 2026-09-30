# Documentación del proyecto: Financial Metrics Dashboard

## Promt
describe el proyecto, sus funcionalidades y estructura, entrega los endpoints de cada servicio. entrega evidencias de cada uno en un archivo .md

## 1. Descripción general

Este proyecto consiste en un dashboard financiero que combina un backend en FastAPI y un frontend en React + TypeScript para visualizar métricas de ingresos, egresos, comparativas y alertas de negocio.

El sistema genera datos financieros simulados y deterministas con una semilla fija, lo que permite que la API y el dashboard siempre respondan con la misma estructura y rangos de datos en entorno local.

## 2. Objetivo funcional

La aplicación permite:

- Consultar movimientos financieros por fecha, categoría y tipo de operación.
- Ver KPIs clave del negocio (ingresos, egresos, beneficio y porcentaje de beneficio).
- Comparar el período actual con un período anterior.
- Agrupar balances por día, semana o mes.
- Detectar alertas de incrementos anómalos en gastos.
- Segmentar información por negocio B2B y B2C.
- Mostrar la información en paneles y gráficos que ayudan a la toma de decisiones.

## 3. Tecnologías

### Backend
- Python 3.14
- FastAPI
- Pydantic
- Uvicorn
- Pytest

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS (via componentes reutilizables y estilo base)

### Infraestructura
- Docker Compose para levantar frontend y backend

## 4. Funcionalidades principales

### 4.1 Dashboard financiero
El frontend carga automáticamente la API y calcula KPI y series mensuales para mostrar:

- total de ingresos
- total de egresos
- beneficio neto
- porcentaje de beneficio
- historial mensual de ingresos vs egresos
- gráfico de beneficio porcentual

Esto se implementa en:

- [frontend/src/App.tsx](../frontend/src/App.tsx)
- [frontend/src/lib/financial-utils.ts](../frontend/src/lib/financial-utils.ts)
- [frontend/src/lib/financial-types.ts](../frontend/src/lib/financial-types.ts)

### 4.2 Generación de datos mock
El backend genera movimientos financieros sintéticos con variables como:

- fecha
- monto
- tipo de operación: income/outcome
- categoría: suppliers, sales, operational, administrative, others
- segmentación: B2B/B2C

La lógica principal está en:

- [backend/app/routes.py](../backend/app/routes.py)

### 4.3 Filtros y agregaciones
La API soporta filtros de:

- start_date / end_date
- category
- operation_type
- business_type
- group_by: day / week / month

Además incluye cálculos de:

- resumen agregado por período
- categorías top por operación
- comparación de periodos
- alertas por aumento de costes

## 5. Estructura del proyecto

```text
.
├── AGENTS.md
├── README.md
├── README.es.md
├── docker-compose.yml
├── memory-bank/
│   ├── DOCUMENTACION_PROYECTO.md
│   ├── EVIDENCIA_VALIDACION_REGLAS.md
│   ├── NOTAS_ANALISIS_OBJETOS_IGNORADOS.md
│   ├── RESUMEN_EJECUTIVO.md
│   └── .agents/rules/
└── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   └── routes.py
│   └── tests/
│       ├── conftest.py
│       └── test_routes.py
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.ts
    ├── index.html
    ├── public/
  ├── specs/
  │   ├── README.md
  │   ├── api-types.ts
  │   ├── param-types.ts
  │   ├── components.md
  │   └── verification.md
    └── src/
        ├── App.tsx
        ├── index.css
        ├── main.tsx
        ├── assets/
        ├── components/
        │   ├── dashboard/
        │   │   ├── dashboard-header.tsx
        │   │   ├── income-outcome-chart.tsx
        │   │   ├── kpi-card.tsx
        │   │   ├── kpi-row.tsx
        │   │   └── profit-percent-chart.tsx
        │   └── ui/
        │       ├── card.tsx
        │       └── skeleton.tsx
        └── lib/
            ├── financial-types.ts
            ├── financial-utils.test.ts
            ├── financial-utils.ts
            ├── mock-data.ts
            └── utils.ts
```

### Especificaciones del frontend

`frontend/specs/` contiene únicamente documentación y contratos TypeScript para F1 (rango de fechas), F2 (alertas de anomalías) y F3 (comparativa B2B vs B2C). El índice y contrato de datos están en [frontend/specs/README.md](../frontend/specs/README.md); los tipos de respuesta y parámetros, en `api-types.ts` y `param-types.ts`; los componentes/props/estados, en [components.md](../frontend/specs/components.md); y la evidencia de OpenAPI, respuestas reales y decisiones, en [verification.md](../frontend/specs/verification.md). Esta carpeta prepara el trabajo frontend, no implementa componentes ni modifica el backend.

## 6. Servicios y endpoints del backend

### 6.1 Endpoint /health
- Método: GET
- Ruta: /health
- Descripción: comprobación de estado del servicio
- Respuesta esperada:

```json
{"status": "ok"}
```

### 6.2 Endpoint /api/metrics
- Método: GET
- Ruta: /api/metrics
- Parámetros opcionales:
  - start_date
  - end_date
  - category
  - operation_type
- Descripción: devuelve la lista completa de movimientos filtrados por fecha, categoría y tipo de operación.
- Respuesta de ejemplo:

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

### 6.3 Endpoint /api/metrics/facets
- Método: GET
- Ruta: /api/metrics/facets
- Descripción: devuelve los valores posibles para filtros y el rango de fechas disponibles.
- Respuesta de ejemplo:

```json
{
  "operation_types": ["income", "outcome"],
  "business_types": ["B2B", "B2C"],
  "categories": ["administrative", "operational", "others", "sales", "suppliers"],
  "min_date": "2025-09-02",
  "max_date": "2026-08-28"
}
```

### 6.4 Endpoint /api/metrics/summary
- Método: GET
- Ruta: /api/metrics/summary
- Parámetros opcionales:
  - group_by = day | week | month
  - start_date
  - end_date
  - category
  - operation_type
  - business_type
- Descripción: agrega ingresos y egresos por periodo.
- Respuesta de ejemplo:

```json
[
  {
    "period": "2025-09",
    "income": 67000.47,
    "outcome": 76372.13,
    "net": -9371.66
  }
]
```

### 6.5 Endpoint /api/metrics/categories/top
- Método: GET
- Ruta: /api/metrics/categories/top
- Parámetros:
  - operation_type (default: outcome)
  - limit (1-20, default 5)
  - start_date
  - end_date
  - business_type
- Descripción: devuelve las categorías más relevantes según el total acumulado.
- Respuesta de ejemplo:

```json
[
  {
    "category": "others",
    "operation_type": "outcome",
    "total_amount": 224428.44
  }
]
```

### 6.6 Endpoint /api/metrics/comparison
- Método: GET
- Ruta: /api/metrics/comparison
- Parámetros obligatorios:
  - start_date
  - end_date
  - business_type (opcional)
- Descripción: compara el neto del período actual con el anterior y calcula delta absoluto y porcentual.
- Respuesta de ejemplo:

```json
{
  "current_period": 0.0,
  "previous_period": 0.0,
  "delta_abs": 0.0,
  "delta_pct": null
}
```

### 6.7 Endpoint /api/metrics/alerts
- Método: GET
- Ruta: /api/metrics/alerts
- Parámetros opcionales:
  - threshold (default 0.3)
  - group_by = day | week | month
  - start_date
  - end_date
  - business_type
- Descripción: detecta periodos donde los egresos superan un umbral frente a su línea base histórica.
- Respuesta de ejemplo:

```json
[
  {
    "period": "2025-12",
    "outcome_total": 103378.98,
    "baseline_average": 59573.44,
    "increase_ratio": 0.7353
  }
]
```

### 6.8 Endpoint /api/metrics/b2b
- Método: GET
- Ruta: /api/metrics/b2b
- Parámetros opcionales:
  - start_date
  - end_date
  - category
  - operation_type
- Descripción: devuelve únicamente movimientos del tipo B2B.
- Respuesta de ejemplo:

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

### 6.9 Endpoint /api/metrics/b2c
- Método: GET
- Ruta: /api/metrics/b2c
- Parámetros opcionales:
  - start_date
  - end_date
  - category
  - operation_type
- Descripción: devuelve únicamente movimientos del tipo B2C.
- Respuesta de ejemplo:

```json
[
  {
    "create_date": "2025-09-06",
    "amount": 1713.71,
    "operation_type": "income",
    "category": "sales",
    "business_type": "B2C"
  }
]
```

## 7. Evidencias verificadas

### 7.1 Verificación de tests del backend
Comando ejecutado:

```bash
cd /workspaces/ai-eng-financial-dashboard-context-project-rrobles/backend && pytest -q
```

Resultado verificado:

```text
15 passed, 1 warning in 0.54s
```

### 7.2 Evidencia de ejecución real de endpoints
Se ejecutaron llamadas reales con FastAPI TestClient para comprobar que cada ruta responde correctamente. Las respuestas observadas fueron:

- /health => status 200, payload: {"status": "ok"}
- /api/metrics => status 200, 360 registros
- /api/metrics/facets => status 200, claves: business_types, categories, max_date, min_date, operation_types
- /api/metrics/summary => status 200, 12 registros agrupados por mes
- /api/metrics/categories/top => status 200, 3 registros
- /api/metrics/comparison => status 200, payload con current_period, previous_period, delta_abs y delta_pct
- /api/metrics/alerts => status 200, lista de alertas con 4 elementos
- /api/metrics/b2b => status 200, 203 registros
- /api/metrics/b2c => status 200, 157 registros

## 8. Conclusión

El proyecto implementa un dashboard financiero completo con backend preparado para métricas analíticas y frontend para visualización de negocio. La API expone endpoints bien estructurados para análisis comercial, comparación temporal, segmentación B2B/B2C y alertas operativas, y la evidencia verificada confirma que todas las rutas responden correctamente y la suite de pruebas pasa exitosamente.
