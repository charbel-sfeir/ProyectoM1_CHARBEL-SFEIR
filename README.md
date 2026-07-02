<div align="center">

# 🎨 ColorflyStudio

**Generador de paletas de color interactivo, construido con HTML, CSS y JavaScript puros.**

[Ver demo en vivo](https://charbel-sfeir.github.io/M1_CHARBEL-SFEIR/) 

</div>

---

## Sobre el proyecto

**ColorflyStudio** genera combinaciones de color aleatorias pensadas para acelerar el arranque de un proyecto de diseño o branding. A partir de un click, produce paletas de 6, 8 o 9 colores en formato HEX o HSL, y a partir de ahí propone variaciones tonales, un gradiente combinado y sugerencias de qué color usar como fondo, texto o acento — basadas en cálculos reales de contraste (WCAG), no en corazonadas.

También podés partir de una imagen propia: subís una foto o un moodboard y la app extrae sus colores dominantes automáticamente.

Sin frameworks, sin dependencias, sin build step. Un `index.html`, una hoja de estilos y un script.

## Funcionalidades

**Generación**
- Paletas de 6, 8 o 9 colores, en HEX o HSL, con distribución de matices por ángulo áureo para evitar tonos repetidos en una misma paleta.
- **Extracción desde una imagen** — subís una foto y un clustering k-means liviano (implementado desde cero, sin librerías) calcula los colores dominantes reales de la imagen.
- **Bloqueo de color** — fijá los que te gustan y regenerá solo el resto.

**Exploración**
- **Variaciones tonales** por color (tints y shades), un click para copiar cualquiera.
- **Gradiente combinado** de toda la paleta, en modo diagonal, horizontal o radial, con su CSS listo para copiar.
- **Sugerencias de uso** — cálculo automático de qué color conviene como fondo, cuál como texto y cuál como acento, con los pares de mejor contraste según WCAG.

**Guardado y exportación**
- Paletas guardadas manualmente en `localStorage`.
- **Historial automático** de las últimas 10 paletas generadas, para volver atrás sin perder nada.
- **Descarga como PNG** — exporta la paleta actual como imagen lista para compartir.
- **Imprimir / Guardar como PDF** — vista de impresión limpia, solo con las fichas de color.
- **Compartir por link** — copia una URL con la paleta codificada; quien la abre ve exactamente esos colores.

**Interfaz**
- Modo claro / oscuro, con persistencia y detección de preferencia del sistema.
- Accesible: navegación por teclado, foco visible, contraste de texto calculado dinámicamente, `aria-live` en el feedback.

## Stack

`HTML5` · `CSS3` (variables nativas, Grid) · `JavaScript` (ES6+, vanilla) · Canvas API para extracción de color y exportación PNG

```
M1_CHARBEL-SFEIR/
├── index.html
├── css/
│   └── styles.css
├── js/
│   └── script.js
└── README.md
```

## Autor

**Charbel Sfeir** — [GitHub](https://github.com/charbel-sfeir)
