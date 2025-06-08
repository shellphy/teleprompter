create table providers (
    id integer primary key autoincrement,
    created_at datetime not null default current_timestamp,
    updated_at datetime not null default current_timestamp,
    name varchar(32) not null,
    description varchar(1024) not null default '',
    type varchar(16) not null default 'openai',
    url varchar(1024) not null,
    api_key varchar(1024) not null,
    enabled boolean not null default true
);