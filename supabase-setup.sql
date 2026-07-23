-- Run once in Supabase: SQL Editor > New query > Run.
-- This lets the public site read, add, and remove products without a login.

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

alter table public.products enable row level security;

drop policy if exists "Anyone can view products" on public.products;
drop policy if exists "Anyone can add products" on public.products;
drop policy if exists "Anyone can delete products" on public.products;

create policy "Anyone can view products"
  on public.products for select to anon using (true);

create policy "Anyone can add products"
  on public.products for insert to anon with check (true);

create policy "Anyone can delete products"
  on public.products for delete to anon using (true);
