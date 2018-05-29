import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AppContextService } from '@msft-sme/shell/angular';
import { Observable, Subscription } from 'rxjs';
import { ServicesService } from '../../services.service';
import { ServicesSettingsBase } from '../services-settings-base'

export enum AccountType {
    Local = 0,
    Other = 1
}

/**
 * Validate self field (eg. 'password') and target field (eg. 'passwordConfirm') match
 *  if true return null;
 *  otherwise return 'mismatch' boolean true,
 *  or if 'isPasswordConfirmation' is false, set the target field 'mismatch' boolean true
 * This is so the error message is always under the password confirmation field
 * Example:
 *  In code:
 *      this.userForm = this.formbuilder.group({
 *         'password': [this.user.password, [Validators.required, Validators.minLength(8),
 *              passwordMatch('passwordConfirm', true)]],
 *         'passwordConfirm': [this.user.passwordConfirm, passwordMatch('password')],
 */
export function passwordMatch(targetName: string, isPasswordConfirmation?: boolean): ValidatorFn {
    return (control: AbstractControl): { [key: string]: boolean } => {
        if (control.root && control.root.get(targetName)) {
            let target = control.root.get(targetName);
            if (!MsftSme.isNullOrWhiteSpace(control.value) && control.value !== target.value) {
                if (isPasswordConfirmation) {
                    return { mismatch: true };

                } else {
                    target.setErrors({ mismatch: true });
                }
            } else {
                if (!isPasswordConfirmation) {
                    target.setErrors(null);
                }
            }
        }
        return null;
    };
}

@Component({
    selector: 'sme-services-log-on-settings',
    templateUrl: './log-on-settings.component.html',
    styleUrls: ['./log-on-settings.component.css']
})
export class LogOnSettingsComponent extends ServicesSettingsBase implements OnInit, OnDestroy {
    private static account = 'account';
    private static username = 'username';
    private static password = 'password';
    private static confirmPassword = 'confirmPassword';
    private static localSystem = 'LocalSystem';

    private subscriptions: Subscription[] = [];
    private currentAccountUsername: string;

    constructor(
        appContextService: AppContextService,
        servicesService: ServicesService,
        router: Router,
        activatedRoute: ActivatedRoute,
        formBuilder: FormBuilder) {
        super(appContextService, servicesService, router, activatedRoute, formBuilder);
        this.settingsForm = this.formBuilder.group({
            account: [''],
            username: ['', [Validators.required]],
            password: ['', [Validators.required, passwordMatch(LogOnSettingsComponent.confirmPassword)]],
            confirmPassword: ['', [Validators.required, passwordMatch(LogOnSettingsComponent.password, true)]]
        });

        this.formErrors = {
            account: '',
            username: '',
            password: '',
            confirmPassword: ''
        };

        this.validationMessages = {
            username: {
                required: this.strings.MsftSmeServiceViewer.Forms.Mandatory
            },
            password: {
                required: this.strings.MsftSmeServiceViewer.Forms.Mandatory,
                mismatch: this.strings.MsftSmeServiceViewer.Settings.LogOn.PasswordMismatch
            },
            confirmPassword: {
                required: this.strings.MsftSmeServiceViewer.Forms.Mandatory,
                mismatch: this.strings.MsftSmeServiceViewer.Settings.LogOn.PasswordMismatch
            }
        }
    }

    private initLogOnSettings() {
        this.subscriptions.push(this.servicesService.logOnOptionsQueryCache
            .createObservable({ params: { serviceName: this.currentServiceNameFromRoute } })
            .subscribe(
            currentAccount => {
                if (currentAccount) {
                    if (currentAccount === LogOnSettingsComponent.localSystem) {
                        this.settingsForm.controls[LogOnSettingsComponent.account].setValue(AccountType.Local);
                        this.disableOtherAccountSettings();
                    } else {
                        this.settingsForm.controls[LogOnSettingsComponent.account].setValue(AccountType.Other);
                        this.enableOtherAccountSettings();

                        this.settingsForm.controls[LogOnSettingsComponent.username].setValue(currentAccount);
                        // fill password box with 10 * by setting value to 10 spaces.
                        // this acts as a placeholder for the actual password for the account, which we will not load.
                        // matches behavior of natice services app
                        const passwordPlaceholder = '          '
                        this.settingsForm.controls[LogOnSettingsComponent.password].setValue(passwordPlaceholder);
                        this.settingsForm.controls[LogOnSettingsComponent.confirmPassword].setValue(passwordPlaceholder);
                    }
                }
                this.loading = false;
            },
            error => {
                this.showErrorAlert(this.strings.MsftSmeServiceViewer.Settings.LogOn.LoadError.format(error));
            }));
    }

    private disableOtherAccountSettings() {
        this.settingsForm.controls[LogOnSettingsComponent.username].disable();
        this.settingsForm.controls[LogOnSettingsComponent.password].disable();
        this.settingsForm.controls[LogOnSettingsComponent.confirmPassword].disable();
    }

    private enableOtherAccountSettings() {
        this.settingsForm.controls[LogOnSettingsComponent.username].enable();
        this.settingsForm.controls[LogOnSettingsComponent.password].enable();
        this.settingsForm.controls[LogOnSettingsComponent.confirmPassword].enable();
    }

    public ngOnInit() {
        this.initLogOnSettings();
        this.settingsForm.valueChanges.subscribe(data => this.onValueChanged(data));
    }

    public onLocalClick() {
        this.disableOtherAccountSettings();
    }

    public onOtherClick() {
        this.enableOtherAccountSettings();
    }

    public onSaveClick() {
        let username = '';
        let password = '';
        if (this.settingsForm.controls[LogOnSettingsComponent.account].value === AccountType.Other) {
            username = this.settingsForm.controls[LogOnSettingsComponent.username].value;
            password = this.settingsForm.controls[LogOnSettingsComponent.password].value;
        }
        this.showInformationalAlert(this.strings.MsftSmeServiceViewer.Settings.LogOn.StartingNotification);
        this.subscriptions.push(this.servicesService.setLogOnOptions(this.currentServiceNameFromRoute, username, password)
            .subscribe(result => {
                if (result && result.exitCode !== 0 && result.errorMessage) {
                    this.showErrorAlert(this.strings.MsftSmeServiceViewer.Settings.LogOn.UpdateError.format(result.errorMessage));
                } else if (!result || !result.errorMessage) {
                    this.showErrorAlert(this.strings.MsftSmeServiceViewer.Settings.LogOn.UnexpectedUpdateError);
                } else {
                    this.showInformationalAlert(this.strings.MsftSmeServiceViewer.Settings.LogOn.SuccessNotification);
                    this.settingsForm.markAsPristine();
                    this.servicesService.logOnOptionsQueryCache.refresh();
                }
            }));
    }

    public onDiscardClick() {
        this.settingsForm.reset();
        this.initLogOnSettings();
    }

    public ngOnDestroy() {
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }
}
