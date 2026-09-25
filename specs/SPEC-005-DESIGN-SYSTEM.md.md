# SPEC-005: Sistema de Diseño Esqueuomórfico (Skeuomorphism UI)

## 1. Visión y Filosofía de Diseño

El diseño de **Enchepaitos Tournament** rinde homenaje al fútbol callejero vintage: una calle de barrio en sepia, pizarras de tiza, cuero cosido y trofeos de metal. Todo con **sensación táctil y textura real**, no superficies planas sintéticas.

### Principios Esqueuomórficos
- **Relieve y profundidad:** biseles, luces superiores, sombras proyectadas e internas (`inset shadow`).
- **Texturas físicas:** foto de calle, cuero, pizarra, metal y cemento mediante imagen + gradientes/patrones CSS.
- **Interacción física:** los botones se "hunden" al pulsar y las tarjetas tienen peso visual.

## 2. Tipografía

- **Encabezados:** `Geist` (cargada con `next/font/google`), aplicada a `h1`-`h6` mediante `--font-heading`.
- **Cuerpo de texto:** `Inter` (`next/font/google`), aplicada al `body` mediante `--font-sans`.
- `text-graffiti`: mayúsculas + tracking para títulos y marcadores.
- **Título de marca** (`text-leather-stitch`): relleno marrón cuero con contorno de hilo crema (`-webkit-text-stroke` + `paint-order: stroke fill`) simulando un balón viejo cosido. Se aplica en la landing y en la marca del navbar.

## 3. Paleta de Color

| Nombre | Hex | Uso |
| --- | --- | --- |
| Foto de calle | imagen sepia | Fondo general |
| Cuero | `#3a2415` → `#150b06` | Tarjetas, fichas |
| Cerveza ámbar | `#f59e0b` / `#d97706` | Premios, acentos |
| Pizarra | `#0b1210` | Clasificación, marcadores |
| Tiza | `#f8fafc` | Texto sobre superficies oscuras |
| Tinta sepia | `#2b1d10` | Texto sobre el fondo (con halo crema) |
| Hilo crema | `#efe0bd` | Costuras, contorno del título, halo |
| Oro / Plata | `#fef08a`→`#ca8a04` / `#cbd5e1` | Trofeos, placas |

### Regla de color de texto
- **Sobre la foto (fondo claro):** `text-ink-halo` (tinta sepia + halo crema) o `text-ink/75`. Nunca `text-chalk`.
- **Sobre superficies oscuras** (navbar de cuero, `Card`/`LeatherCard`, `ChalkboardPanel`, inputs): `text-chalk`.

## 4. Texturas y Fondos

Todas definidas como utilidades en `src/app/globals.css` (Tailwind v4 es CSS-first: `@theme` + `@utility`; **no** usa `tailwind.config.ts`).

### A. Fondo de Calle (fondo general)
- **Utilidad:** `bg-turf-night` (aplicada en `body`).
- **Implementación:** imagen real `public/images/street-background.webp` a pantalla completa (`background-size: cover`, `background-position: center`, `background-attachment: fixed`), **sin overlays ni filtros** para máxima fidelidad de la imagen.

### B. Pizarra Táctica de Tiza
- **Componente:** `src/components/tournament/ChalkboardPanel.tsx`.
- **Estilo:** marco de madera oscura con 4 remaches metálicos (`.rivet`), interior `bg-chalkboard` (negro mate con velo de tiza) y sombra interna (`shadow-skeuo-inset`).

### C. Cuero Envejecido con Costuras
- **Componente:** `src/components/ui/LeatherCard.tsx`.
- **Estilo:** gradiente `bg-leather-texture` (cuero con brillo lateral), borde punteado `leather-stitch` (hilo metálico) y relieve `shadow-skeuo-card`.

### D. Malla Ciclónica / Cemento de Cancha
- **Utilidades:** `bg-chain-link` (rejilla metálica en rombos con sombra interna) y `bg-concrete` (cemento industrial rugoso).
- **Uso:** fondos de modales/diálogos y paneles industriales. El footer se eliminó del layout.

## 5. Sombras y Biseles (tokens `@theme`)

```css
--shadow-skeuo-btn / -active   /* botón extruido / hundido */
--shadow-skeuo-card            /* tarjeta con relieve */
--shadow-skeuo-inset           /* hueco interior */
--shadow-gold-plate            /* placa metálica dorada */
```

## 6. Mapeo de Componentes

| Textura | Componente / Ubicación |
| --- | --- |
| Foto de calle | `app/layout.tsx` → `body` (`bg-turf-night`) |
| Pizarra de tiza | `ChalkboardPanel` (clasificación, marcadores) |
| Cuero con costura | `LeatherCard` (fichas, equipo, trofeos, cerveza) |
| Malla / cemento | fondos de modales/diálogos |
| Título cosido | `text-leather-stitch` (landing + navbar) |
