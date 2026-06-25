juego-terror
TL;DR
Juego/interacción web construido con React + TypeScript + Vite + Tailwind. Buen proyecto para mostrar UI, animaciones (framer-motion), audio (howler) y manejo de estado (zustand).

Demo

(Agrega aquí URL o GIF de la partida)
Características

SPA con Vite
Animaciones con framer-motion
Sonido con Howler
Routing con react-router
Estado con Zustand
Instalación (rápido)

git clone https://github.com/PatoV16/juego-terror.git
cd juego-terror
npm install
npm run dev
Abre http://localhost:5173
Scripts

npm run dev — servidor dev (Vite)
npm run build — build de producción
npm run preview — preview del build
Despliegue

Deploy estático: Vercel, Netlify o GitHub Pages (build -> publish folder "dist" o "build" según configuración)
Docker: opción incluida abajo
CI sugerido

Instalar Node, npm ci, lint, build
Subir artefacto o desplegar a Pages/Netlify
Dockerfile (producción)

Build with Node and serve with nginx (see Dockerfile included)
