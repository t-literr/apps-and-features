// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DevGuideComponent } from './dev-guide.component';
import { LandingComponent } from './landing/landing.component';

const routes: Routes = [
    {
        path: '',
        component: DevGuideComponent,
        children: [
            {
                path: 'landing',
                component: LandingComponent
            },
            {
                path: 'controls',
                loadChildren: './modules/controls/controls.module#ControlsModule'
            },
            {
                path: 'pipes',
                loadChildren: './modules/pipes/pipes.module#PipesModule'
            },
            {
                path: 'styles',
                loadChildren: './modules/styles/styles.module#StylesModule'
            },
            {
                path: '**',
                redirectTo: 'landing'
            }]
    }];

@NgModule({
    imports: [
        RouterModule.forChild(routes)
    ],
    exports: [
        RouterModule
    ]
})
export class DevGuideRoutingModule { }