// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IdleComponent } from '@microsoft/windows-admin-center-sdk/angular';
import { AppsAndFeaturesComponent } from './apps-and-features.component';

const routes: Routes = [
    {
        path: '',
        component: AppsAndFeaturesComponent
    }
];

@NgModule({
    imports: [
        RouterModule.forChild(routes)
    ],
    exports: [
        RouterModule
    ]
})
export class AppsAndFeaturesRouting {}
