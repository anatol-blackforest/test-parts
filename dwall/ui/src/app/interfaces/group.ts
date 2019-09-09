export interface IGroup {
    URL: string;
    id: number | string;
    name: string;
    on_schedule: number;
    playlist_id: number;
    tvList: any;
    isInUse?: boolean;
    playing_fallback: number;
    deviceList?: any[];
}
