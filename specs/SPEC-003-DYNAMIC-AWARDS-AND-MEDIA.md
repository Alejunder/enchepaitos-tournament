### `specs/SPEC-003-DYNAMIC-AWARDS-AND-MEDIA.md`

```markdown # SPEC-003: Motor Dinámico de Premios, Subida de Vídeo y Cervezómetro

## 1. Esquema de Base de Datos (PostgreSQL)

```sql **CREATE** **TYPE** award_category AS **ENUM** ('stat_derived', 'voting_derived');

**CREATE** **TABLE** public.award_definitions (
    id **UUID** **PRIMARY** **KEY** **DEFAULT** gen_random_uuid(),
    code **TEXT** **UNIQUE** **NOT** **NULL**,             -- 'puskas', 'bota_de_oro', 'saco_de_goles'
    name **TEXT** **NOT** **NULL**,                    -- 'Premio Puskas', 'Bota de Oro'
    description **TEXT**,
    icon **TEXT** **NOT** **NULL**,                    -- '🍺', '👞', '🥊'
    category award_category **NOT** **NULL**,
    penalty_payer_rule **TEXT** **DEFAULT** **NULL**,  -- 'MOST_CONCEDED'
    active **BOOLEAN** **DEFAULT** true
);

**CREATE** **TABLE** public.tournament_awards (
    id **UUID** **PRIMARY** **KEY** **DEFAULT** gen_random_uuid(),
    tournament_id **UUID** **REFERENCES** public.tournaments(id) ON **DELETE** **CASCADE**,
    award_definition_id **UUID** **REFERENCES** public.award_definitions(id) ON **DELETE** **CASCADE**,
    winner_id **UUID** **REFERENCES** public.profiles(id) ON **DELETE** **CASCADE**,
    sponsor_id **UUID** **REFERENCES** public.profiles(id) ON **DELETE** **CASCADE**, -- Usuario que paga la penalización
    created_at **TIMESTAMP** **WITH** **TIME** **ZONE** **DEFAULT** **NOW**(),
    **UNIQUE**(tournament_id, award_definition_id)
);

**CREATE** **TABLE** public.puskas_nominations (
    id **UUID** **PRIMARY** **KEY** **DEFAULT** gen_random_uuid(),
    tournament_id **UUID** **REFERENCES** public.tournaments(id) ON **DELETE** **CASCADE**,
    match_id **UUID** **REFERENCES** public.matches(id) ON **DELETE** **CASCADE**,
    user_id **UUID** **REFERENCES** public.profiles(id) ON **DELETE** **CASCADE**,
    video_url **TEXT** **NOT** **NULL**,
    created_at **TIMESTAMP** **WITH** **TIME** **ZONE** **DEFAULT** **NOW**()
);

**CREATE** **TABLE** public.puskas_votes (
    id **UUID** **PRIMARY** **KEY** **DEFAULT** gen_random_uuid(),
    tournament_id **UUID** **REFERENCES** public.tournaments(id) ON **DELETE** **CASCADE**,
    nomination_id **UUID** **REFERENCES** public.puskas_nominations(id) ON **DELETE** **CASCADE**,
    voter_id **UUID** **REFERENCES** public.profiles(id) ON **DELETE** **CASCADE**,
    **UNIQUE**(tournament_id, voter_id) -- Máximo 1 voto por torneo por usuario
);

**CREATE** **TABLE** public.beer_debts (
    id **UUID** **PRIMARY** **KEY** **DEFAULT** gen_random_uuid(),
    tournament_id **UUID** **REFERENCES** public.tournaments(id) ON **DELETE** **CASCADE**,
    debtor_id **UUID** **REFERENCES** public.profiles(id) ON **DELETE** **CASCADE**,  -- El más goleado del torneo
    creditor_id **UUID** **REFERENCES** public.profiles(id) ON **DELETE** **CASCADE**, -- Ganador del Puskas
    status **TEXT** **CHECK** (status IN ('pending', 'settled')) **DEFAULT** 'pending',
    created_at **TIMESTAMP** **WITH** **TIME** **ZONE** **DEFAULT** **NOW**(),
    **UNIQUE**(tournament_id)
);
## Subida de Vídeo Puskas desde GaleríaStorage Bucket: puskas-videos en Supabase Storage.Input Nativo: <input type=*file* accept=*video/mp4,video/quicktime,video/webm* /> (abre la galería en iOS/Android/PC).Límite de Archivo: 50 MB.Ruta de Almacenamiento: puskas/{tournament_id}/{match_id}_{user_id}_{timestamp}.mp43. Lógica de Cierre de Torneo y Asignación de Premios (src/lib/awards.ts)Al cambiar el estado del torneo a finished:Bota de Oro: Calcula el participante con mayor número de goles a favor ($GF$).Saco de Goles (*Al que más se la meten*): Calcula el participante con mayor número de goles recibidos ($GC$).Premio Puskas: Determina la nominación con más votos en puskas_votes.Regla de la Cerveza: Genera un registro en beer_debts fijando como debtor_id al Saco de Goles y como creditor_id al ganador del Puskas.4. Criterios de Aceptación[ ] Los usuarios suben archivos de vídeo directamente desde la galería del dispositivo.[ ] La base de datos rechaza duplicados de votación por usuario en el mismo torneo.[ ] El cierre del torneo genera automáticamente la entrada en el Cervezómetro.