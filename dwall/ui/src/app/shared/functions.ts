import { IDevice } from '../interfaces/device';
import { IGroup } from '../interfaces/group';

const getMediaByUrl = (images: any[], videos: any[], webPages: any[], url: string) => {
    let media = images.concat(videos).concat(webPages);
    return media.find((media: any) => {
        return media.url == url;
    })
}

const findPlaylistById = (playlists: any[], id: number) => {
    if (Array.isArray(playlists)) {
        let playlist = playlists.find((playlist: any) => {
            return playlist.id === id;
        })
        if (playlist) {
            return playlist;
        }
    }
}

const findDeviceByGUID = (devices: IDevice[], guid: string) => {
    let device = devices.find((device: any) => {
        return device.guid === guid;
    })
    return device;
}

const findGroupById = (groups: IGroup[], id: string | number) => {
    let group = groups.find((group: any) => {
        return group.id == id;
    })
    return group;
}

const findEventById = (scheduleEvents: any[], id: string | number, isDevice: boolean) => {
    let event;
    for (let i = 0; i < scheduleEvents.length; i++) {
        let e = scheduleEvents[i].events.find((e: any) => {
            return e.id == id;
        });
        if (e) {
            event = scheduleEvents[i];
            break;
        }
    }
    return event;
}


const detectIE = () => {
    let ua = window.navigator.userAgent;
    // Test values; Uncomment to check result …
    // IE 10
    // ua = 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; Trident/6.0)';
    // IE 11
    // ua = 'Mozilla/5.0 (Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko';
    // Edge 12 (Spartan)
    // ua = 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36 Edge/12.0';
    // Edge 13
    // ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2486.0 Safari/537.36 Edge/13.10586';
    let msie = ua.indexOf('MSIE ');
    if (msie > 0) {
        // IE 10 or older => return version number
        return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
    }
    let trident = ua.indexOf('Trident/');
    if (trident > 0) {
        // IE 11 => return version number
        let rv = ua.indexOf('rv:');
        return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
    }
    let edge = ua.indexOf('Edge/');
    if (edge > 0) {
        // Edge (IE 12+) => return version number
        return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
    }
    // other browser
    return false;
}

const detectMobileDevice = () => {
    if (navigator.userAgent.match(/Android/i)
        || navigator.userAgent.match(/webOS/i)
        || navigator.userAgent.match(/iPhone/i)
        || navigator.userAgent.match(/iPad/i)
        || navigator.userAgent.match(/iPod/i)
        || navigator.userAgent.match(/BlackBerry/i)
        || navigator.userAgent.match(/Windows Phone/i)
    ) {
        return true;
    }
    else {
        return false;
    }
}

const defineDevicesGroup = (guid: string, groups: IGroup[]): any => {
    let group: any;
    for (let i = 0; i < groups.length; i++) {
        for (let j = 0; j < groups[i].deviceList.length; j++) {
            if (groups[i].deviceList[j].guid === guid) {
                group = groups[i];
                break;
            }
        }
    }
    return group;
}

const findEventByTargetId = (events, id, type): any => {
    let event;
    let propertyToTouch = (type == 'device') ? 'tv_guid' : 'group_id';
    event = events.find(e => {
        return (e[propertyToTouch] == id);
    })
    return event;
}

const getGroupsWithConstantEvent = (schedules: any[], groups: IGroup[]) => {
    let noLengthEventsGroups: any[];
    let scheduleGroupEventsIds = [];
    groups = groups.filter((group: IGroup) => (group.playing_fallback == 0) && (group.on_schedule !== 1))
    scheduleGroupEventsIds = schedules.filter(e => !!e.group_id).map(e => +e.group_id);
    if (scheduleGroupEventsIds.length) {
        noLengthEventsGroups = groups.filter((group: IGroup) => (scheduleGroupEventsIds.indexOf(group.id) == -1))
    } else {
        noLengthEventsGroups = groups;
    }
    return noLengthEventsGroups;
}

const getDuration = (playlist: any): number => {
    let total: number = 0;
    playlist.media.forEach(item => {
        total += item.duration;
    });
    return total;
};

const getSize = (playlist: any): number => {
    let total: number = 0;
    playlist.media.forEach(item => {
        total += item.size;
    });
    return total;
};

export {
    getMediaByUrl,
    findPlaylistById,
    findDeviceByGUID,
    findGroupById,
    findEventById,
    detectIE,
    detectMobileDevice,
    defineDevicesGroup,
    findEventByTargetId,
    getGroupsWithConstantEvent,
    getDuration,
    getSize
}
