create table users (
    id serial primary key,
    username varchar(50) not null unique,
    password varchar(255) not null,
    email varchar(100) not null unique,
    created_at timestamp default current_timestamp
);

create table history_games (
    id serial primary key,
    player1_id int references users(id),
    player2_id int references users(id),
    winner_id int references users(id),
    created_at timestamp default current_timestamp
);

create table moves (
    id serial primary key,
    game_id int references history_games(id),
    player_id int references users(id),
    move varchar(10) not null,
    created_at timestamp default current_timestamp
);

