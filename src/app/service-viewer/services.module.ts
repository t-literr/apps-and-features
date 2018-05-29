import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FileExplorerLibModule } from '@msft-sme/file-explorer'
import {
    ActionsModule,
    CanDeactivateGuard,
    DataTableModule,
    DetailsModule,
    DialogModule,
    DialogService,
    ErrorModule,
    InfoDialogModule,
    LoadingWheelModule,
    MasterViewModule,
    PipesModule,
    SettingsModule,
    SplitViewModule,
    ToolHeaderModule
} from '@msft-sme/shell/angular';
import { ContextMenuModule, DropdownModule, PanelModule, SharedModule } from 'primeng/primeng';
import { ServicesComponent } from './services.component';
import { ServicesRoutingModule } from './services.routing';
import { ServicesService } from './services.service';
import { DependenciesSettingsComponent } from './settings/dependencies-settings/dependencies-settings.component';
import { GeneralSettingsComponent } from './settings/general-settings/general-settings.component';
import { LogOnSettingsComponent } from './settings/log-on-settings/log-on-settings.component';
import { RecoverySettingsComponent } from './settings/recovery-settings/recovery-settings.component';
import { ServicesSettingsControlComponent } from './settings/services-settings-control.component'

@NgModule({
    declarations: [
        ServicesComponent,
        DependenciesSettingsComponent,
        GeneralSettingsComponent,
        LogOnSettingsComponent,
        RecoverySettingsComponent,
        ServicesSettingsControlComponent
    ],
    providers: [CanDeactivateGuard, ServicesService, DialogService],
    imports: [
        ActionsModule,
        CommonModule,
        DataTableModule,
        DetailsModule,
        SharedModule,
        ContextMenuModule,
        PipesModule,
        FormsModule,
        DialogModule,
        DropdownModule,
        PanelModule,
        ErrorModule,
        InfoDialogModule,
        LoadingWheelModule,
        ServicesRoutingModule,
        SettingsModule,
        ToolHeaderModule,
        ReactiveFormsModule,
        SplitViewModule,
        MasterViewModule,
        FileExplorerLibModule
    ]
})
export class ServicesModule { }
