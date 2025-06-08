create table messages (
    id integer primary key autoincrement,
    created_at datetime not null default current_timestamp,
    updated_at datetime not null default current_timestamp,
    conversation_id integer not null,
    role varchar(16) not null,
    content text not null
);