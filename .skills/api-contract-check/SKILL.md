---
name: api-contract-check
description: 'Verify frontend TypeScript types and API calls against the live FastAPI OpenAPI contract. Use when editing financial types, fetch calls, or date filters.'
---

# API contract check

## Objetivo
Detectar desajustes entre el contrato HTTP del backend y los tipos y llamadas en `frontend/src/`, sin inferir esquemas a partir de datos simulados.

## Cuándo usarla
Al crear o cambiar tipos, parámetros de consulta o llamadas a la API financiera desde el frontend.

## Inputs
- Backend FastAPI activo en `http://localhost:8000`; `GET /openapi.json` es la fuente de verdad.
- Archivos pertinentes bajo `frontend/src/`, especialmente `src/lib/financial-types.ts` y la llamada que consume el endpoint.

## Pasos
1. Ejecutar `curl -fsS http://localhost:8000/openapi.json` y analizar el JSON: `components.schemas`, la respuesta 200 y `parameters` de la ruta afectada. Si falla, detenerse y reportar que no se pudo validar el contrato vivo.
2. Contrastar propiedades obligatorias, tipos, formatos y enums con los tipos en `frontend/src/`; para `GET /api/metrics`, comprobar que responde con un array de `FinancialMovement`. Los movimientos tienen `create_date` (fecha ISO), mientras los filtros opcionales se llaman `start_date` y `end_date` (`YYYY-MM-DD`); `/api/metrics` no admite `business_type`. Un `string` de TypeScript es compatible con `format: date`, pero no comprueba el formato en tiempo de ejecución: señalarlo como limitación, no como validación de fechas.
3. Revisar la llamada en `frontend/src/` y cotejar los nombres de sus query params con OpenAPI. Si Vite corre en el host de Codespaces y usa `backend:8000`, verificar con `getent hosts backend` que `backend` apunta a `127.0.0.1`; si no, reportar el problema de resolución sin editar `/etc/hosts` automáticamente.
4. Desde `frontend/`, compilar el archivo de tipos comprobado con `npx tsc --ignoreConfig --noEmit --strict --skipLibCheck src/lib/financial-types.ts` (TypeScript 6). No ejecutar `npx tsc` desde la raíz: allí puede intentar instalar otro paquete.

## Output esperado
Informar endpoint y URL de OpenAPI consultada, campos/enum/formatos comparados, coincidencias o diferencias con archivo y campo, resultado de compilación y cualquier comprobación de red aplicable. No cambiar contratos sin autorización.

## Criterios de aceptación
- OpenAPI vivo responde 200 y se identifica el esquema referenciado por la respuesta 200.
- Cada campo `required` del esquema existe en el tipo TypeScript con un tipo compatible.
- Cada enum de OpenAPI coincide con un union literal con los mismos valores.
- Cada parámetro de query usado en la llamada existe en `parameters` de la ruta.
- El informe indica que los campos `format: date` no se validan en tiempo de ejecución.
- La compilación aislada termina con código 0; si falla algún paso, se informa el error exacto y el contrato queda sin validar.
