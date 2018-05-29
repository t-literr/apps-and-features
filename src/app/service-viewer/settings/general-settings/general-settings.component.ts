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
import { Strings } from '../../../../generated/strings';
import { ServicesUtil } from '../../services-util';
import {
    ServiceClassificationData, ServiceData, ServiceFlags,
    ServiceStartupType, ServiceStatus, ServiceSupportedControl, startupTypes
} from '../../services.data';
import { ServicesService } from '../../services.service';
import { ServicesSettingsBase } from '../services-settings-base'

export interface GeneralServiceSettings {
    startupType?: string;
    startPath?: string;
}

export enum StartupType {
    Manual = 'Manual',
    Automatic = 'Automatic',
    Disabled = 'Disabled'
}

@Component({
    selector: 'sme-services-general-settings',
    templateUrl: './general-settings.component.html',
    styleUrls: ['./general-settings.component.css']
})
export class GeneralSettingsComponent extends ServicesSettingsBase implements OnInit, OnDestroy {
    private static startupType = 'startupType';
    private static startPath = 'startPath';
    public startupTypeOptions: SelectItem[] = [];
    public serviceDependencyList: string[];
    public startPathLoading = true;
    public serviceDetailsLoading = true;
    private subscriptions: Subscription[] = [];
    private currentSettings: GeneralServiceSettings = {};
    public currentService: ServiceData;

    constructor(
        appContextService: AppContextService,
        servicesService: ServicesService,
        router: Router,
        activatedRoute: ActivatedRoute,
        formBuilder: FormBuilder) {
        super(appContextService, servicesService, router, activatedRoute, formBuilder);
        this.settingsForm = this.formBuilder.group({
            startupType: [''],
            startPath: ['']
        });
    }

    public ngOnInit() {
        this.subscriptions.push(
            this.servicesService.startPathQueryCache.createObservable({ params: { serviceName: this.currentServiceNameFromRoute } })
                .subscribe(
                path => {
                    this.settingsForm.controls[GeneralSettingsComponent.startPath].setValue(path);
                    this.currentSettings.startPath = path;
                    this.startPathLoading = false;
                },
                error => {
                    this.showErrorAlert(
                        this.strings.MsftSmeServiceViewer.Settings.General.LoadPathError.format(Net.getErrorMessage(error)));
                    this.startPathLoading = false;
                }
                ));

        this.subscriptions.push(this.servicesService.inventoryQueryCache
            .createObservable({ params: { nodeName: this.servicesService.nodeName } })
            .flatMap(inventory => {
                return this.servicesService.servicesQueryCache
                    .createObservable({
                        delayClean: true,
                        params: { isServerManagerAvailable: inventory.isServerManagerAvailable }
                    });
            }).catch(error => {
                this.showErrorAlert(
                    this.strings.MsftSmeServiceViewer.Settings.General.LoadServicesError.format(Net.getErrorMessage(error)));
                this.serviceDetailsLoading = false;
                return Observable.empty();
            }).subscribe((response: ServiceData[]) => {
                this.processServiceData(response);
                this.serviceDetailsLoading = false;
            }));

        this.settingsForm.valueChanges.subscribe(data => this.onValueChanged(data));
        this.onValueChanged();
    }

    public processServiceData(services: ServiceData[]) {
        this.startupTypeOptions = [];
        this.currentService = new ServiceData();
        const service = MsftSme.first(services.filter(x => x.name === this.currentServiceNameFromRoute));
        if (service) {
            this.currentService = service;
            /* TODO: Setting startupType to "Automatic (Delayed Start)" like in services.msc requires registry operations
                and is a different call than the Cim call below. We can consider that post Alpha as per PM confirmation.
                For now, just showing 3 options: Available, Manual and Disabled. */

            //  1st element to be shown in drop down should be the current startup type of the service,
            //  then populate the rest.
            if (this.currentService.startupType === startupTypes[2] ||
                this.currentService.startupType === startupTypes[5] ||
                this.currentService.startupType === startupTypes[6] ||
                this.currentService.startupType === startupTypes[7]) {
                this.currentSettings.startupType = StartupType.Automatic;
                this.startupTypeOptions.push({ label: this.strings.MsftSmeServiceViewer.automatic, value: StartupType.Automatic });
                this.startupTypeOptions.push({ label: this.strings.MsftSmeServiceViewer.manual, value: StartupType.Manual });
                this.startupTypeOptions.push({ label: this.strings.MsftSmeServiceViewer.disabled, value: StartupType.Disabled });
            } else if (this.currentService.startupType === startupTypes[3]
                || this.currentService.startupType === startupTypes[8]) {
                this.currentSettings.startupType = StartupType.Manual;
                this.startupTypeOptions.push({ label: this.strings.MsftSmeServiceViewer.manual, value: StartupType.Manual });
                this.startupTypeOptions.push({ label: this.strings.MsftSmeServiceViewer.disabled, value: StartupType.Disabled });
                this.startupTypeOptions.push({ label: this.strings.MsftSmeServiceViewer.automatic, value: StartupType.Automatic });
            } else {
                this.currentSettings.startupType = StartupType.Disabled;
                this.startupTypeOptions.push({ label: this.strings.MsftSmeServiceViewer.disabled, value: StartupType.Disabled });
                this.startupTypeOptions.push({ label: this.strings.MsftSmeServiceViewer.automatic, value: StartupType.Automatic });
                this.startupTypeOptions.push({ label: this.strings.MsftSmeServiceViewer.manual, value: StartupType.Manual });
            }

            if (this.settingsForm) {
                this.settingsForm.controls[GeneralSettingsComponent.startupType].setValue(this.startupTypeOptions[0].value);
            }
        }
        this.serviceDependencyList = ServicesUtil.getDependentService(this.currentService, services, true);
        /* The way the getDependentService is written, the output includes name of the service itself if there are
            no dependencies.
          So checking for length 1 instead of 0 to declare no dependency. */
        if (this.serviceDependencyList.length === 1) {
            this.serviceDependencyList = [this.strings.MsftSmeServiceViewer.noDependencies];
        } else {
            this.serviceDependencyList.pop();
        }
        this.loading = false;
    }

    public ngOnDestroy() {
        this.currentService = null;
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }

    public onSaveClick() {
        let startupType = this.settingsForm.controls[GeneralSettingsComponent.startupType].dirty ?
            this.settingsForm.controls[GeneralSettingsComponent.startupType].value : null;
        let path = this.settingsForm.controls[GeneralSettingsComponent.startPath].dirty ?
            this.settingsForm.controls[GeneralSettingsComponent.startPath].value : null;
        let message: string;
        let state: NotificationState;
        this.showInformationalAlert(this.strings.MsftSmeServiceViewer.Settings.General.StartingNotification);
        this.subscriptions.push(
            this.servicesService.setStartOptions(this.currentServiceNameFromRoute, startupType, path).subscribe(
                result => {
                    if (result === 0) {
                        this.showInformationalAlert(this.strings.MsftSmeServiceViewer.Settings.General.SuccessNotification);
                        this.settingsForm.markAsPristine();
                        this.servicesService.servicesQueryCache.refresh();
                        this.servicesService.startPathQueryCache.refresh();
                    } else if (result > 0) {
                        // startup type failed with an error code
                        this.showErrorAlert(this.strings.MsftSmeServiceViewer.Settings.General.StartupTypeError.format(result));
                    } else {
                        this.showErrorAlert(this.strings.MsftSmeServiceViewer.Settings.General.UnexpectedUpdateError);
                    }
                },
                error => {
                    this.showErrorAlert(
                        this.strings.MsftSmeServiceViewer.Settings.General.UpdateError.format(Net.getErrorMessage(error)));
                }
            ));
    }

    public onDiscardClick() {
        this.settingsForm.reset(this.currentSettings);
        this.settingsForm.markAsPristine();
    }
}
