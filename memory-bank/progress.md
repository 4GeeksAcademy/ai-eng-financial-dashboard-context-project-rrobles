# Progreso

## Línea base

Lighthouse en modo dev, con datos cargados (puntajes proporcionados por el usuario): Accessibility 100, Best Practices 100, Performance 69, SEO 45.

Performance y SEO en dev no son representativos: código sin minificar, HMR y `noindex` de Codespaces. La línea base de Performance se toma sobre `vite preview`.

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