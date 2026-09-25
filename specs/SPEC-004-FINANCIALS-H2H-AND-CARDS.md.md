### `specs/SPEC-004-FINANCIALS-H2H-AND-CARDS.md`

```markdown # SPEC-004: Billetera (€), Cara a Cara (H2H) y Tarjetas Compartibles

## 1. Algoritmo de Billetera Financiera (€)

### Formulación

Para cada usuario $i$:

$$\text{Saldo}_i = \sum_{t \in T_w(i)} (N_t \times 5) - \sum_{t \in T_p(i)} 5$$

Donde $T_p(i)$ son los torneos jugados, $T_w(i)$ los torneos ganados y $N_t$ la cantidad de participantes del torneo $t$.

### Vista SQL de Billetera

```sql
**CREATE** **VIEW** public.user_financials AS
**WITH** played AS (
    **SELECT** user_id, **COUNT**(tournament_id) * 5 AS total_spent
    **FROM** public.tournament_participants tp
    **JOIN** public.tournaments t ON tp.tournament_id = t.id
    **WHERE** t.status = 'finished'
    **GROUP** BY user_id
),
won AS (
    **SELECT** ta.winner_id AS user_id, **SUM**(p_count.cnt * 5) AS total_won
    **FROM** public.tournament_awards ta
    **JOIN** public.award_definitions ad ON ta.award_definition_id = ad.id
    **JOIN** (
    **SELECT** tournament_id, **COUNT**(user_id) AS cnt 
    **FROM** public.tournament_participants 
    **GROUP** BY tournament_id
    ) p_count ON ta.tournament_id = p_count.tournament_id
    **WHERE** ad.code = 'champion'
    **GROUP** BY ta.winner_id
)
**SELECT** 
    p.id AS user_id,
    p.username,
    **COALESCE**(w.total_won, 0) - **COALESCE**(pl.total_spent, 0) AS net_balance_eur
**FROM** public.profiles p
**LEFT** **JOIN** played pl ON p.id = pl.user_id
**LEFT** **JOIN** won w ON p.id = w.user_id;
## Motor Cara a Cara (H2H - Head to Head)
Estructura de Salida
TypeScript
interface H2HMatchRecord {
    tournamentName: string;
    tournamentTheme: string;
    player1Team: string;
    player2Team: string;
    goalsP1: number;
    goalsP2: number;
    date: string;
}

interface H2HSummary {
    matchesPlayed: number;
    winsPlayerA: number;
    winsPlayerB: number;
    draws: number;
    goalsPlayerA: number;
    goalsPlayerB: number;
    history: H2HMatchRecord[];
}
## Generador de Tarjetas para WhatsApp (src/components/stats/ShareCard.tsx)
Renderiza un componente visual optimizado para captura de pantalla/descarga:

Nombre del Torneo y Temática.

Campeón (con usuario y equipo).

Bota de Oro.

Ganador Puskas.

Indicador del Cervezómetro: *[Perdedor] invita a jarra a [Ganador Puskas]*.

TypeScript import { toPng } from 'html-to-image';

export async function shareCardToWhatsApp(elementId: string) {
    const node = document.getElementById(elementId);
    if (!node) return;
  
    const dataUrl = await toPng(node, { quality: 0.95 });
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], 'resumen-jornada.png', { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({
    files: [file],
    title: 'Resumen Enchepaitos Tournament',
    });
    }
}
## Criterios de Aceptación
[ ] La billetera calcula ganancias/pérdidas en Euros dinámicamente.

[ ] El **H2H** desglosa partidos pasados incluyendo los equipos utilizados por cada jugador.

[ ] La tarjeta para WhatsApp genera la imagen **PNG** integrando la temática del torneo.