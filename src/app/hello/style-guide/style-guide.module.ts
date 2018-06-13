// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActionsModule, AlertBarModule, SmeStylesModule, SvgModule, ToolHeaderModule } from '@microsoft/windows-admin-center-sdk/angular';
import { HelloService } from '../hello.service';
import { StyleGuideComponent } from './style-guide.component';
import { routing } from './style-guide.routing';

@NgModule({
    declarations: [
        StyleGuideComponent
    ],
    providers: [
        HelloService
    ],
    imports: [
        ActionsModule,
        AlertBarModule,
        CommonModule,
        FormsModule,
        SmeStylesModule,
        SvgModule,
        routing,
        ToolHeaderModule
    ]
})
export class StyleGuideModule { }