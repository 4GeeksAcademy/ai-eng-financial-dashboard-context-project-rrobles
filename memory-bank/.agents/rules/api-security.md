# api-security

## Scope
Aplica a la configuración de FastAPI y a cualquier exposición de servicios HTTP.

## Justification
El backend habilita CORS con `allow_origins=["*"]` en [backend/app/main.py](../../../backend/app/main.py). Esto es útil para desarrollo, pero no es adecuado como política de producción.

## Project guidance
- Mantener CORS restringido en entornos no locales.
- No exponer endpoints sin controles mínimos de autenticación o autorización si el proyecto pasa a producción.
- Revisar cualquier nueva ruta pública antes de entregarla a clientes externos.
- Mantener la documentación de `/docs` solo para entornos controlados.

## Apply here
- [backend/app/main.py](../../../backend/app/main.py)
- [docker-compose.yml](../../../docker-compose.yml)
- [README.md](../../../README.md)
