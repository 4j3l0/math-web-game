create table if not exists public.math_game_scores (
    id bigint generated always as identity primary key,
    category text not null check (category in ('facil', 'medio', 'dificil', 'extremo')),
    player_name text not null check (char_length(btrim(player_name)) between 1 and 16),
    score integer not null check (score > 0),
    created_at timestamptz not null default now()
);

alter table public.math_game_scores enable row level security;

revoke insert, update, delete on public.math_game_scores from anon, authenticated;
grant select on public.math_game_scores to anon;

drop policy if exists "Public can read math game scores" on public.math_game_scores;
create policy "Public can read math game scores"
    on public.math_game_scores
    for select
    to anon
    using (true);

create or replace function public.submit_math_game_score(
    p_category text,
    p_name text,
    p_score integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
    minimum_score integer;
begin
    if p_category not in ('facil', 'medio', 'dificil', 'extremo')
        or p_score <= 0
        or char_length(btrim(p_name)) not between 1 and 16 then
        return false;
    end if;

    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(p_category));

    select score into minimum_score
    from public.math_game_scores
    where category = p_category
    order by score desc, created_at asc, id asc
    offset 9 limit 1;

    if minimum_score is not null and p_score < minimum_score then
        return false;
    end if;

    insert into public.math_game_scores (category, player_name, score)
    values (p_category, btrim(p_name), p_score);

    delete from public.math_game_scores
    where id in (
        select id
        from public.math_game_scores
        where category = p_category
        order by score desc, created_at asc, id asc
        offset 10
    );

    return true;
end;
$$;

revoke all on function public.submit_math_game_score(text, text, integer) from public;
grant execute on function public.submit_math_game_score(text, text, integer) to anon;
