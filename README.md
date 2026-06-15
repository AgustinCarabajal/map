# React + Vite + Phaser Map Generator

Esta carpeta contiene una app mínima de React + Vite que usa `phaser` para generar un mapa aleatorio con la imagen `tiles.png`.

## Instalación

Abre un terminal en `c:\Users\Agus\Desktop\code\map` y ejecuta:

```bash
npm install
```

## Ejecutar en modo desarrollo

```bash
npm run dev
```

Luego abre la URL que te muestre Vite.

## Cómo funciona

- `src/Game.jsx` crea un juego Phaser dentro de React.
- `tiles.png` se carga como tileset con `frameWidth = 64` y `frameHeight = 64`.
- El mapa se genera de forma aleatoria en el `create()` del scene.

## Notas

Si quieres usar otros tiles o cambiar el tamaño del mapa, edita `src/Game.jsx`.
