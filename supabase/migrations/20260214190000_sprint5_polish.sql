-- Sprint 5: leaderboards + invites/friends policies

alter table public.invites enable row level security;
alter table public.friend_edges enable row level security;

drop policy if exists "invites_select_public" on public.invites;
create policy "invites_select_public"
on public.invites
for select
to anon, authenticated
using (true);

drop policy if exists "invites_insert_public" on public.invites;
create policy "invites_insert_public"
on public.invites
for insert
to anon, authenticated
with check (true);

drop policy if exists "invites_update_public" on public.invites;
create policy "invites_update_public"
on public.invites
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "friend_edges_select_public" on public.friend_edges;
create policy "friend_edges_select_public"
on public.friend_edges
for select
to anon, authenticated
using (true);

drop policy if exists "friend_edges_insert_public" on public.friend_edges;
create policy "friend_edges_insert_public"
on public.friend_edges
for insert
to anon, authenticated
with check (true);
