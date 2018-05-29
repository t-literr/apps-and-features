import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, ActivatedRouteSnapshot, Router } from '@angular/router';
import {
    FileExplorerDialogOptions,
    FileExplorerDialogResult,
    FileExplorerDialogType,
    FileExtensionData,
    FileExtensionItem
} from '@msft-sme/file-explorer/dist/app/file-explorer/dialogs/file-explorer/file-explorer-dialog-interfaces';
import { AlertBarService, AppContextService, DialogService } from '@msft-sme/shell/angular';
import { Net } from '@msft-sme/shell/core';

import { Observable, Subscription } from 'rxjs';
import { ServicesService } from '../../services.service';
import { ServicesSettingsBase } from '../services-settings-base'

export enum FailureAction {
    Reboot = 'reboot',
    Restart = 'restart',
    RunProgram = 'run',
    None = ''
}

export interface ServiceRecoverySettings {
    firstFailureAction: FailureAction;
    secondFailureAction: FailureAction;
    thirdFailureAction: FailureAction;
    resetFailCountInterval: number;
    restartServiceInterval?: number;
    pathToProgram?: string;
    programParameters?: string;
}

export interface FailureActionFormInput {
    label: string;
    failureAction: FailureAction;
}

@Component({
    selector: 'sme-services-recovery-settings',
    templateUrl: './recovery-settings.component.html'
})
export class RecoverySettingsComponent extends ServicesSettingsBase implements OnInit, OnDestroy {
    public static firstFailureAction = 'firstFailureAction';
    public static secondFailureAction = 'secondFailureAction';
    public static thirdFailureAction = 'thirdFailureAction';
    public static resetFailCountInterval = 'resetFailCountInterval';
    public static restartServiceInterval = 'restartServiceInterval';
    public static pathToProgram = 'pathToProgram';
    public static programParameters = 'programParameters';

    public recoveryOptions: FailureActionFormInput[] = [];
    public subscriptions: Subscription[] = [];
    public isFileExplorerDialogOpen = false;
    public currentRecoverySettings: ServiceRecoverySettings;

    constructor(
        appContextService: AppContextService,
        servicesService: ServicesService,
        router: Router,
        activatedRoute: ActivatedRoute,
        formBuilder: FormBuilder,
        private dialogService: DialogService) {
        super(appContextService, servicesService, router, activatedRoute, formBuilder);
        this.settingsForm = this.formBuilder.group({
            firstFailureAction: [FailureAction.None],
            secondFailureAction: [FailureAction.None],
            thirdFailureAction: [FailureAction.None],
            resetFailCountInterval: ['', [Validators.required, Validators.min(0)]],
            restartServiceInterval: ['', [Validators.required, Validators.min(0)]],
            pathToProgram: [''],
            programParameters: ['']
        });

        this.formErrors = {
            firstFailureAction: '',
            secondFailureAction: '',
            thirdFailureAction: '',
            resetFailCountInterval: '',
            restartServiceInterval: '',
            pathToProgram: '',
            programParameters: ''
        };

        this.validationMessages = {
            resetFailCountInterval: {
                required: this.strings.MsftSmeServiceViewer.Forms.Mandatory,
                min: this.strings.MsftSmeServiceViewer.Forms.PositiveNumber
            },
            restartServiceInterval: {
                required: this.strings.MsftSmeServiceViewer.Forms.Mandatory,
                min: this.strings.MsftSmeServiceViewer.Forms.PositiveNumber
            }
        }

        this.recoveryOptions.push({
            label: this.strings.MsftSmeServiceViewer.Settings.Recovery.RebootOption,
            failureAction: FailureAction.Reboot
        });
        this.recoveryOptions.push({
            label: this.strings.MsftSmeServiceViewer.Settings.Recovery.RunOption,
            failureAction: FailureAction.RunProgram
        });
        this.recoveryOptions.push({
            label: this.strings.MsftSmeServiceViewer.Settings.Recovery.RestartOption,
            failureAction: FailureAction.Restart
        });
        this.recoveryOptions.push({
            label: this.strings.MsftSmeServiceViewer.Settings.Recovery.NoActionOption,
            failureAction: FailureAction.None
        });
    }

    public ngOnInit() {
        this.subscriptions.push(this.servicesService.recoveryOptionsQueryCache
            .createObservable({ params: { serviceName: this.currentServiceNameFromRoute } })
            .subscribe(
            (result: ServiceRecoverySettings) => {
                this.currentRecoverySettings = result;
                if (result) {
                    if (result.firstFailureAction) {
                        this.settingsForm.controls[RecoverySettingsComponent.firstFailureAction].setValue(result.firstFailureAction);
                    }

                    if (result.secondFailureAction) {
                        this.settingsForm.controls[RecoverySettingsComponent.secondFailureAction].setValue(result.secondFailureAction);
                    }

                    if (result.thirdFailureAction) {
                        this.settingsForm.controls[RecoverySettingsComponent.thirdFailureAction].setValue(result.thirdFailureAction);
                    }

                    if (result.resetFailCountInterval) {
                        this.settingsForm.controls[RecoverySettingsComponent.resetFailCountInterval]
                            .setValue(MsftSme.round(result.resetFailCountInterval, 3));
                    }

                    if (result.restartServiceInterval) {
                        this.settingsForm.controls[RecoverySettingsComponent.restartServiceInterval]
                            .setValue(MsftSme.round(result.restartServiceInterval, 3));
                    }

                    if (result.pathToProgram) {
                        this.settingsForm.controls[RecoverySettingsComponent.pathToProgram].setValue(result.pathToProgram);
                    }

                    if (result.programParameters) {
                        this.settingsForm.controls[RecoverySettingsComponent.programParameters].setValue(result.programParameters);
                    }

                } else {
                    this.showErrorAlert(this.strings.MsftSmeServiceViewer.Settings.Recovery.UnexpectedLoadError);
                }
                this.loading = false;
            },
            error => {
                this.showErrorAlert(this.strings.MsftSmeServiceViewer.Settings.Recovery.LoadError.format(Net.getErrorMessage(error)));
                this.loading = false;
            })
        );

        this.settingsForm.valueChanges.subscribe(data => this.onValueChanged(data));

        this.settingsForm.controls[RecoverySettingsComponent.firstFailureAction].valueChanges.subscribe(value => {
            this.setRestartServiceIntervalState()
            this.setPathToProgramState();
        });
        this.settingsForm.controls[RecoverySettingsComponent.secondFailureAction].valueChanges.subscribe(value => {
            this.setRestartServiceIntervalState()
            this.setPathToProgramState();
        });
        this.settingsForm.controls[RecoverySettingsComponent.thirdFailureAction].valueChanges.subscribe(value => {
            this.setRestartServiceIntervalState()
            this.setPathToProgramState();
        });

        this.setRestartServiceIntervalState();
        this.setPathToProgramState();
        this.onValueChanged();
    }

    public ngOnDestroy() {
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }

    public setRestartServiceIntervalState() {
        if (this.settingsForm.controls[RecoverySettingsComponent.firstFailureAction].value === FailureAction.Restart
            || this.settingsForm.controls[RecoverySettingsComponent.secondFailureAction].value === FailureAction.Restart
            || this.settingsForm.controls[RecoverySettingsComponent.thirdFailureAction].value === FailureAction.Restart) {
            this.settingsForm.controls[RecoverySettingsComponent.restartServiceInterval].enable();
        } else {
            this.settingsForm.controls[RecoverySettingsComponent.restartServiceInterval].disable();
        }
    }

    public setPathToProgramState() {
        if (this.settingsForm.controls[RecoverySettingsComponent.firstFailureAction].value === FailureAction.RunProgram
            || this.settingsForm.controls[RecoverySettingsComponent.secondFailureAction].value === FailureAction.RunProgram
            || this.settingsForm.controls[RecoverySettingsComponent.thirdFailureAction].value === FailureAction.RunProgram) {
            this.settingsForm.controls[RecoverySettingsComponent.pathToProgram].enable();
            this.settingsForm.controls[RecoverySettingsComponent.programParameters].enable();
        } else {
            this.settingsForm.controls[RecoverySettingsComponent.pathToProgram].disable();
            this.settingsForm.controls[RecoverySettingsComponent.programParameters].disable();
        }
    }

    public onSaveClick() {
        let recoveryOptions: ServiceRecoverySettings = {
            firstFailureAction: this.settingsForm.controls[RecoverySettingsComponent.firstFailureAction].value,
            secondFailureAction: this.settingsForm.controls[RecoverySettingsComponent.secondFailureAction].value,
            thirdFailureAction: this.settingsForm.controls[RecoverySettingsComponent.thirdFailureAction].value,
            resetFailCountInterval: this.settingsForm.controls[RecoverySettingsComponent.resetFailCountInterval].value,
            restartServiceInterval: this.settingsForm.controls[RecoverySettingsComponent.restartServiceInterval].value,
            pathToProgram: this.settingsForm.controls[RecoverySettingsComponent.pathToProgram].value,
            programParameters: this.settingsForm.controls[RecoverySettingsComponent.programParameters].value
        };
        this.showInformationalAlert(this.strings.MsftSmeServiceViewer.Settings.Recovery.StartingNotification);
        this.servicesService.setRecoveryOptions(this.currentServiceNameFromRoute, recoveryOptions).subscribe(
            result => {
                if (result && result.exitCode !== 0 && result.errorMessage) {
                    this.showErrorAlert(this.strings.MsftSmeServiceViewer.Settings.Recovery.UpdateError.format(result.errorMessage));
                } else if (!result || !result.errorMessage) {
                    this.showErrorAlert(this.strings.MsftSmeServiceViewer.Settings.Recovery.UnexpectedUpdateError);
                } else {
                    this.showInformationalAlert(this.strings.MsftSmeServiceViewer.Settings.Recovery.SuccessNotification);
                    this.settingsForm.markAsPristine();
                    this.servicesService.recoveryOptionsQueryCache.refresh();
                }
            },
            error => {
                this.showErrorAlert(this.strings.MsftSmeServiceViewer.Settings.Recovery.UpdateError.format(Net.getErrorMessage(error)));
            })
    }

    public onBrowseProgramPathClick() {
        const pathControl = this.settingsForm.get(RecoverySettingsComponent.pathToProgram);
        let pickerPath = pathControl.value;
        this.isFileExplorerDialogOpen = true;

        let fileExtentionItem: FileExtensionItem[] = [{
            extensionLabel: this.strings.MsftSmeServiceViewer.Settings.Recovery.FilePicker.ExtensionLabel,
            extension: ['exe', 'com', 'cmd', 'bat']
        }];
        let fileExtensionData: FileExtensionData = {
            fileExtensionPickerLabel: this.strings.MsftSmeServiceViewer.Settings.Recovery.FilePicker.ExtensionLabel,
            acceptAllFileExtensions: true,
            acceptAllFileExtensionsLabel: this.strings.MsftSmeServiceViewer.Settings.Recovery.FilePicker.AllFiles,
            fileExtensions: fileExtentionItem
        }
        this.dialogService.show(
            'sme-services-file-picker',
            <FileExplorerDialogOptions>{
                title: this.strings.MsftSmeServiceViewer.Settings.Recovery.FilePicker.Title,
                cancelButtonText: this.strings.MsftSmeServiceViewer.Settings.Recovery.FilePicker.Cancel,
                dialogType: FileExplorerDialogType.File,
                inputLabelText: this.strings.MsftSmeServiceViewer.Settings.Recovery.FilePicker.Label,
                openButtonText: this.strings.MsftSmeServiceViewer.Settings.Recovery.FilePicker.Ok,
                selectedPath: pickerPath,
                fileExtensions: fileExtensionData
            }).subscribe((result: FileExplorerDialogResult) => {
                if (result && result.selectedPath) {
                    pathControl.setValue(result.selectedPath);
                    pathControl.markAsDirty();
                    pathControl.markAsTouched();
                }
                this.isFileExplorerDialogOpen = false; // reset when this dialog closed
            });
    }

    public onDiscardClick() {
        this.settingsForm.reset(this.currentRecoverySettings);
        this.settingsForm.markAsPristine();
    }
}
