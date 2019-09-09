import { environment } from '../../environments/environment';

const dWallDefaultFallback = environment.fallbackUrl;
const dWallDefaultFallbackThumb = './assets/images/rsz_wallpaper1.png';

const mediaTypes = {
    video: 'video',
    image: 'image',
    youTube: 'youTube',
    stripe: 'stripe',
    playlist: 'playlist',
    rss: 'rss',
    webPage: 'webPage',
    file: 'file',
    overlay: 'overlay'
}

const targetTypes = {
    device: 'device',
    group: 'group'
}

const colors = {
    white: '#ffffff',
    black: '#000000',
    transparent: 'rgba(255, 255, 255, 0)',
    dwBlue: '#0e5fae',
    allowDropGray: '#dadfea'
}

export {
    mediaTypes,
    targetTypes,
    colors,
    dWallDefaultFallbackThumb,
    dWallDefaultFallback
}
