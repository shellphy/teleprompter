create table settings (
    id integer primary key autoincrement,
    created_at datetime not null default current_timestamp,
    updated_at datetime not null default current_timestamp,
    category varchar(128) not null default '',
    name varchar(128) not null default '',
    payload text not null
);