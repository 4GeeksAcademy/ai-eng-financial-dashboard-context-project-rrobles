# Progreso

## Línea base

Lighthouse en modo dev, con datos cargados (puntajes proporcionados por el usuario): Accessibility 100, Best Practices 100, Performance 69, SEO 45.

Performance y SEO en dev no son representativos: código sin minificar, HMR y `noindex` de Codespaces. La línea base de Performance se toma sobre `vite preview`.

Lighthouse sobre el build de producción con `vite preview` (mediciones proporcionadas por el usuario): Performance 99, FCP 0,6 s, LCP 0,6 s, TBT 0 ms, CLS 0,009. Un solo archivo JavaScript de aproximadamente 585 KB (175 KB gzip); Lighthouse estima que aproximadamente el 39 % no se usa durante la carga inicial.

Comando ejecutado desde `frontend/`: `npm run build 2>&1`

Salida completa (exit code 0):

```text
> frontend@0.0.0 build
> tsc -b && vite build

vite v8.0.8 building client environment for production...
✓ 2290 modules transformed.
computing gzip size...
dist/index.html                   0.45 kB │ gzip:   0.29 kB
dist/assets/index-DCNIvorZ.css   17.61 kB │ gzip:   4.28 kB
dist/assets/index-z8H6cNp0.js   584.26 kB │ gzip: 175.20 kB

✓ built in 2.23s
[plugin builtin:vite-reporter] 
(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rolldownOptions.output.codeSplitting to improve chunking: https://rolldown.rs/reference/OutputOptions.codeSplitting
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
```

## Auditoría de bundle y metadatos

- Metadatos de `frontend/index.html`: requisito del brief del tech lead, no de la skill. El título y la meta description describen el dashboard financiero.
- Imágenes (punto 3 del brief): `next/image` no aplica porque el frontend usa React con Vite, no Next.js. El único archivo de imagen del proyecto es `frontend/public/favicon.svg`; los demás iconos visibles provienen de `lucide-react` (SVG). No hay elementos `<img>` que optimizar con esa API.
- Fuentes (punto 3 del brief): `frontend/index.html` no carga fuentes externas y `frontend/src/index.css` solo declara `Inter` como primera opción de una pila con fuentes del sistema, sin `@font-face` ni import de archivos de fuente. El HTML y CSS compilados tampoco contienen fuentes web. No hay una fuente descargada a la que aplicar `font-display` o precarga; `next/font` tampoco aplica en Vite.
- Separación de React y Recharts: hallazgo de la auditoría de bundle motivado por el chunk inicial superior a 500 kB. Se prueba con `build.rolldownOptions.output.codeSplitting.groups` de Vite para que los cambios en código de la app no invaliden innecesariamente las dependencias. Es una solución de configuración de Vite, no una regla literal de `vercel-react-best-practices`; no se aumenta `chunkSizeWarningLimit`.
- `bundle-dynamic-imports` con `React.lazy` para los gráficos: rechazado porque ambos están en la vista inicial y retrasarlos podría empeorar LCP.
- `bundle-barrel-imports` para Lucide: no aplicado; el paquete declara ESM y `sideEffects: false`, y no se ha medido peso innecesario en producción.
- `bundle-conditional` y `bundle-preload`: no hay funcionalidad pesada opcional ni una navegación posterior que anticipar.
- `client-swr-dedup`: no se observa duplicación de peticiones; la app carga datos con un solo fetch.
- `rerender-memo` y `js-combine-iterations` para `computeKPIs` y `computeMonthlyData`: se ejecutan al recibir los datos, no en cada render; TBT medido de 0 ms, sin coste relevante observado.

### Resultado del experimento con Vite

`npm run build` terminó correctamente (Vite 8.0.8). El HTML generado precarga los tres chunks compartidos, además del script de la app: todos forman parte de la carga inicial.

| JavaScript emitido | Tamaño | Gzip |
| --- | ---: | ---: |
| `rolldown-runtime-Dw2cE7zH.js` | 0,68 kB | 0,41 kB |
| `index-B4vf0MJu.js` (app) | 41,00 kB | 12,89 kB |
| `react-CnHJ8Anj.js` | 189,60 kB | 59,63 kB |
| `recharts-_ldvfMnQ.js` | 353,50 kB | 102,97 kB |
| **Total de JS inicial** | **584,78 kB** | **175,90 kB** |

La línea base histórica de esta página registró un chunk de 584,26 kB (175,20 kB gzip); tras los cambios de accesibilidad, el último build anterior al experimento emitía 585,14 kB (175,44 kB gzip). Frente a este último, el total baja unos 0,36 kB sin comprimir y sube unos 0,46 kB gzip. Un nuevo `npm run build` confirmó los mismos cuatro chunks y terminó sin la advertencia de chunks superiores a 500 kB; no se aumentó `chunkSizeWarningLimit`.

Lighthouse de producción después de separar los chunks (mediciones proporcionadas por el usuario): Performance pasó de 99 a 98 y LCP de 0,6 s a 0,8 s, dentro del rango esperable por las peticiones adicionales. En esa medición, el JS inicial pasó de 174,6 KB a 177,3 KB gzip (+2,7 KB), repartido en app 13,4 KB, React 59,7 KB, Recharts 102,9 KB y runtime 1,3 KB. Estos tamaños medidos en Lighthouse se registran por separado de los tamaños gzip emitidos por Vite en la tabla anterior (175,90 kB en total).

El beneficio buscado es la caché entre despliegues: si solo cambia la app y el navegador conserva los chunks de dependencias, la transferencia de JS nuevo baja de aproximadamente 175 KB a aproximadamente 13 KB. En una visita sin caché se siguen descargando los cuatro chunks. SEO pasó de 45 a 54 tras añadir la meta description por requisito del brief, no por una regla de la skill; la línea base de 45 se midió en dev con `noindex` de Codespaces y no es una comparación aislada de producción.
