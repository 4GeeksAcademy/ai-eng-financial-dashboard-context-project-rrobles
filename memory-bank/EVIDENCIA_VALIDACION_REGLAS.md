# Evidencia de validación de reglas

## 1. Objetivo
Validar cada regla creada en [.agents/rules](.agents/rules) con una tarea real del flujo del proyecto y dejar evidencia objetiva del resultado.

## 2. Método
Se ejecutó una validación real con:

- pruebas del backend
- compilación del frontend
- llamadas HTTP reales a FastAPI usando TestClient
- comprobación directa de archivos de configuración

## 3. Evidencia ejecutada

### 3.1 Backend
Comando ejecutado:

```bash
cd /workspaces/ai-eng-financial-dashboard-context-project-rrobles/backend && pytest -q
```

Resultado verificado:

```text
15 passed, 1 warning in 1.03s
```

### 3.2 Frontend
Comando ejecutado:

```bash
cd /workspaces/ai-eng-financial-dashboard-context-project-rrobles/frontend && npm run build
```

Resultado verificado:

```text
✓ built in 1.16s
```

### 3.3 Probes de regla sobre la API
Comando ejecutado:

```bash
cd /workspaces/ai-eng-financial-dashboard-context-project-rrobles/backend && python - <<'PY'
from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)

r1 = client.get('/api/metrics')
r2 = client.get('/api/metrics')
print('mock_data_same_seed=', r1.json()[:2] == r2.json()[:2], 'len1=', len(r1.json()), 'len2=', len(r2.json()))

valid = client.get('/api/metrics/comparison', params={'start_date': '2025-03-01', 'end_date': '2025-03-31'})
invalid = client.get('/api/metrics/comparison', params={'start_date': '2025-03-31', 'end_date': '2025-03-01'})
print('valid_date_range_status=', valid.status_code)
print('invalid_date_range_status=', invalid.status_code)
print('invalid_date_range_payload=', invalid.json())

summary = client.get('/api/metrics/summary', params={'group_by': 'month'})
print('summary_keys=', sorted(summary.json()[0].keys()))
print('security_policy=', 'allow_origins=["*"]' in open('app/main.py').read())
PY
```

Salida verificada:

```text
mock_data_same_seed= True len1= 360 len2= 360
valid_date_range_status= 200
invalid_date_range_status= 200
invalid_date_range_payload= {'current_period': 0.0, 'previous_period': 0.0, 'delta_abs': 0.0, 'delta_pct': None}
summary_keys= ['income', 'net', 'outcome', 'period']
security_policy= True
```

## 4. Resultado por regla

| Regla | Tarea real validada | Evidencia | Resultado |
| --- | --- | --- | --- |
| api-contracts | Consultar resumen de métricas y comprobar contrato de salida del endpoint | salida con claves `income`, `net`, `outcome`, `period` | Cumple |
| mock-data-boundary | Ejecutar dos llamadas consecutivas a `/api/metrics` | `mock_data_same_seed= True len1= 360 len2= 360` | Cumple como regla de consistencia determinista |
| frontend-data-flow | Compilar el frontend y verificar que la app consume la API sin errores de build | `✓ built in 1.16s` | Cumple |
| date-validation | Probar rango inválido en comparación de periodos | `invalid_date_range_status= 200` con payload nulo de comparación | No cumple |
| api-security | Revisar la política de CORS del backend | `security_policy= True` en [backend/app/main.py](backend/app/main.py) | Riesgo identificado |

## 5. Análisis de cada regla

### api-contracts
Aplica en [backend/app/routes.py](backend/app/routes.py) y [frontend/src/lib/financial-types.ts](frontend/src/lib/financial-types.ts).

Tarea realizada: consultar `/api/metrics/summary` y comprobar la estructura del objeto devuelto.

Resultado: la API devuelve una estructura consistente con el contrato esperado, y la regla se valida correctamente.

### mock-data-boundary
Aplica en [backend/app/routes.py](backend/app/routes.py) y [backend/tests/test_routes.py](backend/tests/test_routes.py).

Tarea realizada: ejecutar dos llamadas consecutivas a `/api/metrics` con la misma semilla.

Resultado: la respuesta es determinista; la regla se cumple. Este es un comportamiento útil para demo y pruebas, pero también confirma que la fuente de datos es mockeada y no persistente.

### frontend-data-flow
Aplica en [frontend/src/App.tsx](frontend/src/App.tsx), [frontend/src/lib/financial-utils.ts](frontend/src/lib/financial-utils.ts) y [frontend/src/lib/financial-types.ts](frontend/src/lib/financial-types.ts).

Tarea realizada: compilar el frontend con `npm run build`.

Resultado: el flujo principal del frontend se compila sin errores. La regla se valida positivamente.

### date-validation
Aplica en [backend/app/routes.py](backend/app/routes.py).

Tarea realizada: llamar a `/api/metrics/comparison` con fechas invertidas, usando `start_date=2025-03-31` y `end_date=2025-03-01`.

Resultado observado:

```text
invalid_date_range_status= 200
invalid_date_range_payload= {'current_period': 0.0, 'previous_period': 0.0, 'delta_abs': 0.0, 'delta_pct': None}
```

Conclusión: la regla no se cumple. Existe un fallo real de validación de rango que permite aceptar fechas invertidas y devolver un resultado aparentemente válido, aunque no lógico para la operación.

### api-security
Aplica en [backend/app/main.py](backend/app/main.py).

Tarea realizada: comprobar la configuración de CORS.

Resultado observado:

```text
security_policy= True
```

Conclusión: el proyecto, en este estado, mantiene CORS abierto con `allow_origins=["*"]`. Esto es válido para desarrollo, pero debe considerarse un riesgo operativo para producción.

## 6. Conclusión
La validación demuestra que:

- las reglas de contrato, flujo frontend y datos mockeados se cumplen en el proceso real del proyecto;
- la regla de validación de fechas no se cumple con una tarea real y debe corregirse;
- la regla de seguridad revela un riesgo explícito de configuración para entornos productivos.

## 7. Archivos relevantes

- [.agents/rules](.agents/rules)
- [backend/app/routes.py](backend/app/routes.py)
- [backend/app/main.py](backend/app/main.py)
- [backend/tests/test_routes.py](backend/tests/test_routes.py)
- [frontend/src/App.tsx](frontend/src/App.tsx)
- [frontend/src/lib/financial-utils.ts](frontend/src/lib/financial-utils.ts)
- [frontend/src/lib/financial-types.ts](frontend/src/lib/financial-types.ts)

## 8. Evidencia del cambio de la regla date-validation

Se actualizó la regla en [.agents/rules/date-validation.md](.agents/rules/date-validation.md) para describir la validación ejecutable correcta:

- si `start_date > end_date`, la API debe devolver error de validación
- se debe usar un mensaje explícito: `start_date must be less than or equal to end_date`
- se incluye una tarea ejecutable con `curl` para validar fechas invertidas

Validación de la actualización de la regla realizada con:

```bash
cd /workspaces/ai-eng-financial-dashboard-context-project-rrobles && python - <<'PY'
text = open('.agents/rules/date-validation.md', 'r', encoding='utf-8').read()
print('date_validation_updated=', 'start_date > end_date' in text)
print('validation_message_present=', 'start_date must be less than or equal to end_date' in text)
print('task_present=', 'curl "http://localhost:8000/api/metrics/comparison?start_date=2025-03-31&end_date=2025-03-01"' in text)
PY
```

Resultado verificado:

```text
date_validation_updated= True
validation_message_present= True
task_present= True
```

## 9. Pruebas ejecutadas al final del cambio

### 9.1 Backend
```bash
cd /workspaces/ai-eng-financial-dashboard-context-project-rrobles/backend && pytest -q
```
Resultado:
```text
15 passed, 1 warning in 1.03s
```

### 9.2 Frontend
```bash
cd /workspaces/ai-eng-financial-dashboard-context-project-rrobles/frontend && npm run build
```
Resultado:
```text
✓ built in 1.16s
```

### 9.3 Validación de la regla date-validation
```bash
cd /workspaces/ai-eng-financial-dashboard-context-project-rrobles/backend && python - <<'PY'
from app.main import app
from fastapi.testclient import TestClient
client = TestClient(app)
valid = client.get('/api/metrics/comparison', params={'start_date': '2025-03-01', 'end_date': '2025-03-31'})
invalid = client.get('/api/metrics/comparison', params={'start_date': '2025-03-31', 'end_date': '2025-03-01'})
print('valid_date_range_status=', valid.status_code)
print('invalid_date_range_status=', invalid.status_code)
print('invalid_date_range_payload=', invalid.json())
PY
```
Resultado observado antes del arreglo:
```text
valid_date_range_status= 200
invalid_date_range_status= 200
invalid_date_range_payload= {'current_period': 0.0, 'previous_period': 0.0, 'delta_abs': 0.0, 'delta_pct': None}
```

Esto confirma que la regla no estaba cumpliéndose en el estado anterior y que la corrección debe realizarse en la lógica de la ruta y en la prueba de regresión asociada.
