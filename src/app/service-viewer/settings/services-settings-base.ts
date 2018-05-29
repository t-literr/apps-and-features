import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, ActivatedRouteSnapshot, Router } from '@angular/router';
import { NavigationExtras, RouterStateSnapshot } from '@angular/router';
import {
    AppContextService,
    CommonSettingsNavigationItem,
    ConfirmationDialogOptions,
    SingleSettingComponentBase
} from '@msft-sme/shell/angular';
import { Net, NotificationState } from '@msft-sme/shell/core';
import { SelectItem } from 'primeng/primeng';
import { Observable, Subscription } from 'rxjs';
import { Strings } from '../../../generated/strings';
import { ServicesUtil } from '../services-util';
import { ServiceData } from '../services.data';
import { ServicesService } from '../services.service';

export abstract class ServicesSettingsBase {
    public settingsForm: FormGroup;
    public strings: Strings = this.appContextService.resourceCache.getStrings<Strings>();
    public formErrors: any;
    public validationMessages: any;
    public loading = true;
    public currentServiceNameFromRoute: string;

    public static navigationTitle(appContextService: AppContextService, snapshot: ActivatedRouteSnapshot): string {
        return snapshot.url.first().path;
    }

    constructor(
        protected appContextService: AppContextService,
        protected servicesService: ServicesService,
        protected router: Router,
        protected activatedRoute: ActivatedRoute,
        protected formBuilder: FormBuilder) {
        this.currentServiceNameFromRoute = this.activatedRoute.snapshot.parent.params['name'];
    }

    public onCloseClick() {
        this.router.navigate(['/name', this.activatedRoute.snapshot.parent.params['name']], {
            relativeTo: this.activatedRoute
        });
    }

    public confirmContinueEditingDialogOptions(
        dirtyForm: FormGroup,
        allForms: FormGroup[]): ConfirmationDialogOptions {
        return {
            cancelButtonText: this.strings.MsftSmeServiceViewer.discardChanges,
            confirmButtonText: this.strings.MsftSmeServiceViewer.continueChanges,
            message: this.strings.MsftSmeServiceViewer.unsavedMessage,
            title: this.strings.MsftSmeServiceViewer.unsavedChanges
        };
    }

    public onValueChanged(data?: any) {
        if (!this.settingsForm) {
            return;
        }

        const form = this.settingsForm;

        for (const field in this.formErrors) {
            if (this.formErrors.hasOwnProperty(field)) {
                // clear previous error message (if any)
                this.formErrors[field] = '';
                const control = form.get(field);

                if (control && control.dirty && !control.valid) {
                    const messages = this.validationMessages[field];
                    for (const key in control.errors) {
                        if (control.errors.hasOwnProperty(key)) {
                            this.formErrors[field] += messages[key] + ' ';
                        }
                    }
                }
            }
        }
    }

    public showErrorAlert(message: string) {
        this.appContextService.notification.alert(
            this.appContextService.activeConnection.nodeName, NotificationState.Error, message);
    }

    public showInformationalAlert(message: string) {
        this.appContextService.notification.alert(
            this.appContextService.activeConnection.nodeName, NotificationState.Informational, message);
    }
}
