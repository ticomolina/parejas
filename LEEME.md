# PAREJAS QUE LEEN

Juego de parejas (emoji + palabra) para chicos que están aprendiendo a leer. PWA estática: funciona sin internet y se instala en la tablet.

## Publicar

**Netlify (lo más rápido):** entrá a app.netlify.com/drop y arrastrá la carpeta `parejas-que-leen` completa.

**GitHub Pages:** subí el contenido de la carpeta a un repo, y en Settings → Pages elegí la rama `main` y la carpeta `/ (root)`.

## Instalar en cada tablet

1. Abrí la dirección en Chrome.
2. Menú ⋮ → **Instalar app** (o "Agregar a pantalla principal").
3. Abrila una vez con internet: a partir de ahí funciona offline.

El récord se guarda en cada tablet por separado.

## Editar palabras y dificultad

Todo está en **`datos/palabras.js`**:
- `CONFIG.niveles`: cuántas parejas tiene cada nivel y de qué grupo salen las palabras.
- `CONFIG.cambiarTemaCada`: cada cuántos niveles cambia la temática.
- `TEMAS`: las listas de cada temática (cortas, medianas, largas, parecidas).

**Después de cualquier cambio**, abrí `sw.js` y subí la versión (`pql-v1` → `pql-v2`). Si no, las tablets siguen mostrando la versión guardada. Los cambios aparecen la segunda vez que abren la app.

## Para probar niveles

En la computadora, con el juego abierto, en la consola del navegador:
`PQL.irANivel(9)` salta directo al nivel 9.

## Archivos

```
index.html             pantallas
css/estilos.css        estilo visual
js/juego.js            lógica del juego
js/sonidos.js          sonidos (generados en el momento, sin archivos)
datos/palabras.js      ← lo editable
sw.js                  modo offline
manifest.webmanifest   instalación
fonts/  icons/
```
