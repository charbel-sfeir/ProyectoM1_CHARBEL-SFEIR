# Paleta - Generador de Paletas Interactivo

Proyecto Integrador M1 - Full Stack (Henry)

Demo: https://charbel-sfeir.github.io/ProyectoM1_CHARBEL-SFEIR/

## Qué es esto

Es una página web que genera paletas de colores para usar en proyectos de diseño. Se puede elegir generar los colores al azar, o subir una imagen y sacar los colores principales de esa imagen.

La hice con HTML, CSS y JavaScript, sin usar ningún framework ni librería externa. Todo el código corre en el navegador, no tiene backend ni base de datos (eso lo vamos a ver en los próximos módulos).

## Qué se puede hacer

- Generar una paleta de 6, 8 o 9 colores, en formato HEX o HSL
- Sacar los colores de una imagen que subas (usa un algoritmo de agrupamiento llamado k-means, que armé yo mismo sin librerías)
- Bloquear un color para que no cambie cuando generás una paleta nueva
- Ver variaciones más claras y más oscuras de cada color
- Armar un gradiente con toda la paleta y copiar el CSS
- La página te sugiere qué color usar de fondo, cuál de texto y cuál de acento, calculando el contraste entre colores (esto sigue el estándar de accesibilidad WCAG, para que el texto se pueda leer bien)
- Guardar paletas que te gusten (se guardan en el navegador con localStorage)
- Un historial automático de las últimas paletas que generaste
- Descargar la paleta como imagen PNG
- Compartir una paleta por link (queda codificada en la URL)
- Modo oscuro
- Imprimir o guardar como PDF

## Cómo lo armé (estructura de archivos)

```
index.html      -> la estructura de la pagina
css/styles.css  -> todos los estilos
js/script.js    -> toda la logica
README.md       -> este archivo
```

Separé todo en tres archivos distintos porque es la forma más ordenada de trabajar sin frameworks: HTML para la estructura, CSS para cómo se ve, y JS para lo que hace.

## Cómo probarlo en tu compu

Clonás el repo:
```
git clone https://github.com/charbel-sfeir/ProyectoM1_CHARBEL-SFEIR.git
```

Y abrís `index.html` con la extensión Live Server de VS Code (o directamente lo abrís con el navegador, funciona igual porque no necesita instalar nada).

## Algunas decisiones que tomé

- Usé HSL en vez de RGB para generar los colores porque es más fácil controlar que no salgan muy oscuros o muy claros.
- Para que los colores de una misma paleta no se parezcan mucho entre sí, en vez de generar el matiz totalmente al azar, voy saltando siempre el mismo ángulo (137.5°) en la rueda de colores. Es una forma de repartir los colores de manera más pareja.
- Para las sugerencias de contraste, calculé la fórmula de luminancia relativa que usa WCAG (el estándar de accesibilidad web) y con eso el ratio de contraste entre dos colores. Si el ratio da 4.5 o más, se considera que el texto se puede leer bien.
- Para sacar los colores de una imagen, uso un algoritmo de clustering (k-means): agrupa los píxeles de la imagen según qué tan parecido es su color, y el centro de cada grupo termina siendo un color de la paleta.

## Cosas que sé que se pueden mejorar

- El algoritmo de extracción de imagen no anda tan bien con fotos que tienen pocos colores o son muy uniformes.
- Todo lo que se guarda (paletas guardadas, historial) queda en el navegador de cada persona, no hay una cuenta ni nada centralizado - eso necesitaría un backend, que todavía no vimos en el curso.

## Autor

Charbel Sfeir - https://github.com/charbel-sfeir