alter table playlists
modify column rss_update_interval int not null default 900000;