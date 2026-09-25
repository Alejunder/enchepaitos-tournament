### `specs/SPEC-002-TOURNAMENT-ENGINE.md`

```markdown # SPEC-002: Motor de Torneos, Temáticas, Elección de Equipo y Calendario

## 1. Esquema de Base de Datos (PostgreSQL)

```sql **CREATE** **TYPE** tournament_status AS **ENUM** ('draft', 'active', 'finished');

**CREATE** **TABLE** public.tournaments (
    id **UUID** **PRIMARY** **KEY** **DEFAULT** gen_random_uuid(),
    name **TEXT** **NOT** **NULL**,                   -- Ej: *Enchepaitos Tournament #3*
    theme **TEXT** **NOT** **NULL**,                  -- Ej: *Selecciones Clásicas 90s*, *Champions Night*
    entry_fee **NUMERIC**(6,2) **NOT** **NULL** **DEFAULT** 5.00,
    status tournament_status **NOT** **NULL** **DEFAULT** 'draft',
    created_at **TIMESTAMP** **WITH** **TIME** **ZONE** **DEFAULT** **NOW**()
);

-- Inscripción de jugadores con selección de equipo de **FL26**
**CREATE** **TABLE** public.tournament_participants (
    tournament_id **UUID** **REFERENCES** public.tournaments(id) ON **DELETE** **CASCADE**,
    user_id **UUID** **REFERENCES** public.profiles(id) ON **DELETE** **CASCADE**,
    team_name **TEXT** **NOT** **NULL**,              -- Ej: *Real Madrid*, *AC Milan **2007***, *Brasil '02*
    **PRIMARY** **KEY** (tournament_id, user_id)
);

**CREATE** **TABLE** public.matches (
    id **UUID** **PRIMARY** **KEY** **DEFAULT** gen_random_uuid(),
    tournament_id **UUID** **REFERENCES** public.tournaments(id) ON **DELETE** **CASCADE**,
    jornada **INT** **NOT** **NULL**,
    player1_id **UUID** **REFERENCES** public.profiles(id) ON **DELETE** **CASCADE**,
    player2_id **UUID** **REFERENCES** public.profiles(id) ON **DELETE** **CASCADE**,
    goals_p1 **INT** **DEFAULT** **NULL**,
    goals_p2 **INT** **DEFAULT** **NULL**,
    played **BOOLEAN** **GENERATED** **ALWAYS** AS (goals_p1 IS **NOT** **NULL** **AND** goals_p2 IS **NOT** **NULL**) **STORED**,
    updated_at **TIMESTAMP** **WITH** **TIME** **ZONE** **DEFAULT** **NOW**()
);
## Algoritmo de Rotación de Berger (src/lib/berger.ts)
TypeScript
export interface Participant {
    userId: string;
    username: string;
    teamName: string;
}

export interface Match {
    home: Participant;
    away: Participant;
}

export interface Matchday {
    round: number;
    matches: Match[];
}

export function generateRoundRobin(participants: Participant[]): Matchday[] {
    let list = [...participants];
    if (list.length % 2 !== 0) {
    list.push({ userId: '**BYE**', username: '**DESCANSA**', teamName: '-' });
    }

    const n = list.length;
    const roundsCount = n - 1;
    const matchesPerRound = n / 2;
    const schedule: Matchday[] = [];

    for (let round = 0; round < roundsCount; round++) {
    const roundMatches: Match[] = [];
    for (let i = 0; i < matchesPerRound; i++) {
    const home = list[i];
    const away = list[n - 1 - i];

    if (home.userId !== '**BYE**' && away.userId !== '**BYE**') {
    roundMatches.push({ home, away });
    }
    }
    schedule.push({ round: round + 1, matches: roundMatches });

    // Rotar lista manteniendo el índice 0 fijo
    list = [list[0], list[n - 1], ...list.slice(1, n - 1)];
    }

return schedule; } ## Flujo de Inscripción y Creación de Torneo Creación por Admin: Introduce el nombre del torneo y la Temática (Ej: *Especial Equipos de Autor*).

Inscripción del Jugador: Al unirse al torneo, el usuario aprobado debe seleccionar/escribir obligatoriamente el Nombre del Equipo con el que jugará.

Generación de Calendario: El Admin presiona *Generar Calendario*. El motor invoca generateRoundRobin registrando los enfrentamientos.

Visualización: En la tabla de clasificación y tarjetas de partidos se muestra tanto el nombre del usuario como su equipo seleccionado.

## Criterios de Aceptación

[ ] No se permite la inscripción de un usuario a un torneo sin especificar su equipo.

[ ] La temática del torneo se muestra prominentemente en la cabecera de la página del torneo.

[ ] Las tablas de posiciones y los partidos muestran el formato: Usuario (Equipo).