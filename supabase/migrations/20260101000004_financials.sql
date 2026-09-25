-- SPEC-004: Billetera financiera (€)
--   Saldo_i = Σ_{t ∈ T_w(i)} (N_t × entry_fee) − Σ_{t ∈ T_p(i)} entry_fee

create or replace view public.user_financials
with (security_invoker = true)
as
with played as (
    select tp.user_id, sum(t.entry_fee) as total_spent
    from public.tournament_participants tp
    join public.tournaments t on tp.tournament_id = t.id
    where t.status = 'finished'
    group by tp.user_id
),
won as (
    select
        ta.winner_id as user_id,
        sum(p_count.cnt * t.entry_fee) as total_won
    from public.tournament_awards ta
    join public.award_definitions ad on ta.award_definition_id = ad.id
    join public.tournaments t on ta.tournament_id = t.id
    join (
        select tournament_id, count(user_id) as cnt
        from public.tournament_participants
        group by tournament_id
    ) p_count on ta.tournament_id = p_count.tournament_id
    where ad.code = 'champion' and t.status = 'finished'
    group by ta.winner_id
)
select
    p.id as user_id,
    p.username,
    coalesce(w.total_won, 0) - coalesce(pl.total_spent, 0) as net_balance_eur
from public.profiles p
left join played pl on p.id = pl.user_id
left join won w on p.id = w.user_id;

grant select on public.user_financials to anon, authenticated;
