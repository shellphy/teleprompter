create table topics (
     id integer primary key autoincrement,
    created_at datetime not null default current_timestamp,
    updated_at datetime not null default current_timestamp,
    
    name varchar(128) not null,
    type integer not null default 1,
    enabled boolean not null default true
);