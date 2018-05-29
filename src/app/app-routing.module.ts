import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IdleComponent } from '@msft-sme/shell/angular';

const appRoutes: Routes = [
    {
        path: 'idle',
        component: IdleComponent
    },
    {
        path: '',
        loadChildren: 'app/service-viewer/services.module#ServicesModule'
    },
    {
        path: '**',
        redirectTo: ''
    }
];

@NgModule({
    imports: [
        RouterModule.forRoot(
            appRoutes,
            {
                // un-comment to enable debug log messages
                // enableTracing: true,

                // don't navigate at initially.
                initialNavigation: false
            })
    ],
    exports: [
        RouterModule
    ]
})
export class AppRoutingModule {}