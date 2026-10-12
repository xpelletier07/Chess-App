-- Autorise les comptes OAuth sans mot de passe ou email GitHub public.
alter table users alter column password drop not null;
alter table users alter column email drop not null;
-- Relie chaque compte Chess-App à un seul identifiant GitHub stable.
alter table users add column if not exists github_id varchar(64) unique;
