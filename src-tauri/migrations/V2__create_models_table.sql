create table models (
    id integer primary key autoincrement,
    created_at datetime not null default current_timestamp,
    updated_at datetime not null default current_timestamp,
    
    name varchar(32) not null,
    enabled boolean not null default true,
    description varchar(1024) not null default '',
    icon varchar(1024) not null default '',
    is_online boolean not null default false,
    type varchar(16) not null default 'openai',
    url varchar(1024) not null,
    api_key varchar(1024) not null,
    default_define varchar(32) not null default '',
    define_list text not null default '[]' 
);