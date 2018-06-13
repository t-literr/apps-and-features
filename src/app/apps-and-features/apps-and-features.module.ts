import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
    ActionsModule,
    AlertBarModule,
    DataTableModule,
    DetailsModule,
    LoadingWheelModule,
    MasterViewModule,
    SmeFormsModule,
    SmeStylesModule,
    SplitViewModule,
    SvgModule,
    ToolHeaderModule
} from '@microsoft/windows-admin-center-sdk/angular';
import { AppsAndFeaturesComponent } from './apps-and-features.component';
import { AppsAndFeaturesRouting } from './apps-and-features.routing';
import { AppsAndFeaturesService } from './apps-and-features.service';

import { ContextMenuModule, SharedModule, TreeTableModule } from 'primeng/primeng';

@NgModule({
    declarations: [
        AppsAndFeaturesComponent
    ],
    providers: [
        AppsAndFeaturesService
    ],
    imports: [
        ActionsModule,
        AlertBarModule,
        AppsAndFeaturesRouting,
        CommonModule,
        DataTableModule,
        DetailsModule,
        FormsModule,
        LoadingWheelModule,
        MasterViewModule,
        SmeFormsModule,
        SmeStylesModule,
        SplitViewModule,
        SvgModule,
        ToolHeaderModule,
        TreeTableModule
    ]
})
export class AppsAndFeaturesModule { }
