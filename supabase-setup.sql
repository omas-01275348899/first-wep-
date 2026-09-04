-- Run once in Supabase: SQL Editor > New query > Run.
-- The public site can read products. Product management must use an authenticated server/admin flow.

create table if not exists public.products (
  id text primary key,
  name text not null,
  price numeric not null,
  description text not null,
  image text,
  specs jsonb not null default '[]'::jsonb,
  benefits jsonb not null default '[]'::jsonb,
  package jsonb not null default '[]'::jsonb,
  services jsonb not null default '[]'::jsonb
);

-- If the table was created earlier, add any fields that were not present then.
alter table public.products add column if not exists name text;
alter table public.products add column if not exists price numeric;
alter table public.products add column if not exists description text;
alter table public.products add column if not exists image text;
alter table public.products add column if not exists specs jsonb not null default '[]'::jsonb;
alter table public.products add column if not exists benefits jsonb not null default '[]'::jsonb;
alter table public.products add column if not exists package jsonb not null default '[]'::jsonb;
alter table public.products add column if not exists services jsonb not null default '[]'::jsonb;

alter table public.products enable row level security;

drop policy if exists "Anyone can view products" on public.products;
drop policy if exists "Anyone can add products" on public.products;
drop policy if exists "Anyone can delete products" on public.products;
drop policy if exists "Authenticated admins can add products" on public.products;
drop policy if exists "Authenticated admins can delete products" on public.products;

create policy "Anyone can view products"
  on public.products for select to anon using (true);

-- Do not grant insert/delete to anon. Add narrowly scoped authenticated admin policies
-- after configuring Supabase Auth and an admin role on the server.
