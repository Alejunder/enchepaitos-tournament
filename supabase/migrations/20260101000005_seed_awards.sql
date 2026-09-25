-- Seed de definiciones de premios (SPEC-003 / SPEC-004)

insert into public.award_definitions
    (code, name, description, icon, category, penalty_payer_rule)
values
    ('champion', 'Campeón', 'Ganador del torneo', '🏆', 'stat_derived', null),
    ('bota_de_oro', 'Bota de Oro', 'Máximo goleador del torneo', '👞', 'stat_derived', null),
    ('saco_de_goles', 'Saco de Goles', 'Al que más goles le meten', '🥅', 'stat_derived', 'MOST_CONCEDED'),
    ('puskas', 'Premio Puskas', 'Mejor gol votado por la comunidad', '🥊', 'voting_derived', null)
on conflict (code) do update set
    name = excluded.name,
    description = excluded.description,
    icon = excluded.icon,
    category = excluded.category,
    penalty_payer_rule = excluded.penalty_payer_rule;
