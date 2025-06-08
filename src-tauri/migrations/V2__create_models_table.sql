create table models (
    id integer primary key autoincrement,
    created_at datetime not null default current_timestamp,
    updated_at datetime not null default current_timestamp,
    provider_id integer not null,
    name varchar(32) not null,
    enabled boolean not null default true
);