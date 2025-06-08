create table conversations (
    id integer primary key autoincrement,
    created_at datetime not null default current_timestamp,
    updated_at datetime not null default current_timestamp,
    title varchar(128) not null default ''
);