import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CanDeactivateGuard } from '@msft-sme/shell/angular';
import { ServicesComponent } from './services.component';
// import { DependenciesSettingsComponent } from './settings/dependencies-settings/dependencies-settings.component';
import { GeneralSettingsComponent } from './settings/general-settings/general-settings.component';
import { LogOnSettingsComponent } from './settings/log-on-settings/log-on-settings.component';
import { RecoverySettingsComponent } from './settings/recovery-settings/recovery-settings.component';
import { ServicesSettingsControlComponent } from './settings/services-settings-control.component'

const routes: Routes = [
    {
        path: '',
        component: ServicesComponent,
        pathMatch: 'full'
    },
    {
        path: `name/:name`,
        component: ServicesComponent,
        pathMatch: 'full'
    },
    {
        path: 'settings/:name',
        component: ServicesSettingsControlComponent,
        canDeactivate: [CanDeactivateGuard],
        children: [
            {
                path: '',
                pathMatch: 'full',
                redirectTo: 'general'
            },
            {
                path: 'general',
                component: GeneralSettingsComponent
            },
            {
                path: 'logon',
                component: LogOnSettingsComponent
            },
            {
                path: 'recovery',
                component: RecoverySettingsComponent
            }
            // uncomment when dependencies settings are completed
            // {
            //     path: 'dependencies',
            //     component: DependenciesSettingsComponent
            // }
        ]
    },
    {
        path: '**',
        redirectTo: ''
    }];
@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ServicesRoutingModule { }
