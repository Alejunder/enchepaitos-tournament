# SPEC-006: Fechas, Portada y Fases Eliminatorias Dinámicas

## 1. Modelo de Datos

Cambios sobre `public.tournaments` y `public.matches`:

- `tournaments.starts_at timestamptz NOT NULL` — fecha/hora del torneo (deadline de inscripción).
- `tournaments.cover_image_url text NULL` — imagen de portada (bucket `tournament-covers`).
- `tournament_status` añade el valor `'knockout'`.
- `matches.phase text NOT NULL DEFAULT 'group'` ∈ (`group`, `playin`, `round16`, `quarter`, `semi`, `final`).
- `matches.bracket_slot integer NULL` — semilla/slot dentro de la fase eliminatoria.
- `matches.player1_id` / `player2_id` pasan a ser `NULL` (para cuadros con rival por definir).
- **Título derivado:** el campo manual "Título" se elimina del formulario; el título (`name`) se deriva de la temática (`name = theme`). El campo principal obligatorio pasa a ser la **fecha y hora**.

## 2. Fase de Grupos e Inscripción

- **Deadline:** los usuarios solo pueden inscribirse hasta `starts_at`. Superada la fecha (o si el estado ya no es `draft`) se cierra la inscripción.
- **Trigger automático:** al alcanzar `starts_at`, el ciclo de vida (`src/lib/lifecycle.ts`) cierra inscripciones y genera el calendario round-robin (algoritmo de Berger), pasando el torneo a `active`. Se ejecuta de forma diferida al leer el torneo (sin cron), usando el cliente con `service_role`.

## 3. Transición Automática a Eliminatorias

- Cuando todos los partidos de la fase de grupos tienen resultado, el ciclo de vida calcula la clasificación final y genera el bracket, pasando el torneo a `knockout`.
- Si el corte requiere **sub-eliminatoria (play-in)**, se programan esos cruces antes del cuadro definitivo.
- Los ganadores se promocionan automáticamente al siguiente cruce (`syncKnockoutBracket`) según avanza la competición.

### Formato de las eliminatorias (ida y vuelta)

- **Play-in**: partido único.
- **Octavos, Cuartos y Semifinales**: ida y vuelta (2 partidos por cruce).
- **Final**: partido único.
- **Resolución**: se suma el **agregado** de los dos partidos (o el marcador único). Si queda **empatado**, deciden los **penaltis** (registrados en la vuelta o en el partido único).
- Modelo de datos: `matches.leg` (1 = ida, 2 = vuelta) y `matches.penalties_p1`/`penalties_p2`.

## 4. Reglas de Clasificación (`src/lib/knockout.ts`)

El cuadro final es siempre un número par cerrado: **4 = Semifinales, 8 = Cuartos, 16 = Octavos**.

Dado `N` participantes ordenados por clasificación:

- `bracketSize(N)`: 4 si `N ≤ 8`, 8 si `N ≤ 15`, 16 en adelante (tope = Octavos).
- `extra = N - bracketSize`
- `playIns = floor((extra - 1) / 2)`
- `eliminados = extra - playIns`
- `directos = bracketSize - playIns`

Casos concretos (verificados):

| N | Cuadro | Directos | Play-in | Eliminados |
| --- | --- | --- | --- | --- |
| 2 | Final | 2 | 0 | 0 |
| 3 | Final | 1 | 1 (2º vs 3º) | 0 |
| 4 | Semis | 4 | 0 | 0 |
| 5 | Semis | 4 | 0 | 1 |
| 6 | Semis | 4 | 0 | 2 |
| 7 | Semis | 3 | 1 (4º vs 5º) | 2 |
| 8 | Semis | 3 | 1 (4º vs 5º) | 3 |
| 9 | Cuartos | 8 | 0 | 1 |
| 15 | Cuartos | 5 | 3 | 4 |
| 16 | Octavos | 16 | 0 | 0 |

Con **3 jugadores**, el 1º clasificado pasa **directo a la Final** y el 2º vs 3º disputan la sub-eliminatoria por la otra plaza.

El emparejamiento de la primera ronda usa siembra estándar (1 vs N, 2 vs N-1, …).

## 5. UI/UX

- **Portada:** imagen de portada como hero en la landing, la lista de torneos y la página del torneo (responsiva con `object-cover`).
- **Fecha:** se muestra la fecha/hora del torneo y el estado de inscripción (abierta / cerrada).
- **Bracket:** el cuadro de eliminatorias se agrupa por fase (play-in, octavos, cuartos, semifinales, final) tanto en la vista pública como en el panel de administración (donde se introducen resultados).
