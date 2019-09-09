import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MainComponent } from '../../components/main/main.component';
import { InfoComponent } from '../../components/info/info.component';

const appRoutes: Routes = [
    //{ path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', loadChildren: '../auth/auth.module#AuthModule' },
    {
        path: 'main', component: MainComponent, children: [
            { path: '', redirectTo: 'devices', pathMatch: 'full' },
            { path: 'devices', loadChildren: '../devices/devices.module#DevicesModule' },
            { path: 'schedule', loadChildren: '../schedule/schedule.module#ScheduleModule' },
            { path: 'media', loadChildren: '../media/media.module#MediaModule' },
            { path: 'playlists', loadChildren: '../playlists/playlists.module#PlaylistsModule' },
            { path: 'settings', loadChildren: '../user/user.module#UserModule' }
        ]
    },
    {
        path: 'failure', component: InfoComponent, data: {
            error: 'Something went wrong'
        }
    },
    { path: 'terms', component: InfoComponent },
    { path: 'policy', component: InfoComponent },
    {
        path: '**', component: InfoComponent, data: {
            error: 'This page doesn\'t exist'
        }
    }
];

@NgModule({
    imports: [
        RouterModule.forRoot(appRoutes)
    ],
    exports: [
        RouterModule
    ]
})
export class AppRoutingModule { }