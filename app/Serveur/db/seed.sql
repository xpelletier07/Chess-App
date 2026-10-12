create extension if not exists pgcrypto;

insert into users (username, email, password) values
    ('Joueur1', 'joueur1@chessapp.com', crypt('chessapp1', gen_salt('bf', 10))),
    ('Joueur2', 'joueur2@chessapp.com', crypt('chessapp2', gen_salt('bf', 10)))
on conflict do nothing;