export interface IDevice {
    constant_play: number;
    f_url: string;
    guid: string;
    input_id: string | number;
    on_schedule: number;
    orientation: string;
    playLocalyStatus: number;
    playlist_id: number;
    playlists_status: number;
    playing_fallback: number;
    tv_location: string;
    tv_name: string;
    tv_note: string;
    url: string;
    inGroup?: string;
    status?: any;
    is_multicast?: any;
    limit?: number;
    email?: string;
}
