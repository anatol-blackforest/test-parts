create table licence
(id int not null,
 user_id int not null,
 single_amount int not null default 0,
 multicats_amount int not null default 0,
 primary key(id)
);

alter table users add column multicast_limit int not null default 0;

