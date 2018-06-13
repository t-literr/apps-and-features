import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, ActivatedRouteSnapshot, Router } from '@angular/router';
import {
    AppContextService,
    ConfirmationListDialogOptions,
    ConfirmationListDialogResult,
    DataTableComponent,
    Debounce,
    DialogService
} from '@msft-sme/shell/angular';
import { Logging, LogLevel, LogRecord, Net, NotificationState, RpcReportData } from '@msft-sme/shell/core';
import { SelectItem } from 'primeng/primeng';
import { Observable, Subscription } from 'rxjs';
import { Strings } from '../../generated/strings';
import { ServicesUtil } from './services-util';
import {
    ServiceClassificationData,
    ServiceData,
    ServiceFlags,
    ServiceStartupType,
    ServiceStatus,
    ServiceSupportedControl,
    startupTypes
} from './services.data';
import { ServicesService } from './services.service';

@Component({
    selector: 'sme-services',
    templateUrl: './services.component.html',
    styleUrls: ['./services.component.css']
})
export class ServicesComponent implements OnInit, OnDestroy {
    private static refreshTimeoutinMilliSeconds = 5000;

    @ViewChild('smeDataTable') public dataTable: DataTableComponent;

    public strings: Strings = MsftSme.resourcesStrings<Strings>();
    public loadingMessage = this.strings.MsftSmeServiceViewer.loadingMessage;
    public name = this.strings.MsftSmeServiceViewer.name;
    public displayName = this.strings.MsftSmeServiceViewer.displayName;
    public status = this.strings.MsftSmeServiceViewer.status;
    public startupType = this.strings.MsftSmeServiceViewer.startupType;
    public descriptionHeader = this.strings.MsftSmeServiceViewer.descriptionHeader;
    public loading = true;
    public services: ServiceData[];
    public selectedService: ServiceData;
    public dependentServices: ServiceClassificationData[];
    public serviceDependencyList: string[];
    public startStopButtonText = this.strings.MsftSmeServiceViewer.startServiceText;
    public startStopButtonEnabled = false;
    public startStopButtonIcon = 'sme-icon icon-win-play';
    public pauseResumeButtonText = this.strings.MsftSmeServiceViewer.pauseServiceText;
    public pauseResumeButtonEnabled = false;
    public pauseResumeButtonIcon = 'sme-icon icon-win-pause';

    private rootSubscription: Subscription;
    private selectedServiceStartupType: string;
    private startupTypeLoading = false;
    private isServiceRunning: boolean;
    private isServicePaused: boolean;
    private isServiceStopped: boolean;
    private isServiceDisabled: boolean;
    private acceptPause: boolean;
    private acceptStop: boolean;

    public static navigationTitle(appContextService: AppContextService, snapshot: ActivatedRouteSnapshot): string {
        if (snapshot.params && snapshot.params['name']) {
            return snapshot.params['name'];
        }

        return MsftSme.resourcesStrings<Strings>().MsftSmeServiceViewer.summary.title;
    }

    constructor(
        private appContextService: AppContextService,
        private changeDetectorRef: ChangeDetectorRef,
        private servicesService: ServicesService,
        private dialogService: DialogService,
        private router: Router,
        private route: ActivatedRoute) {
        this.servicesService.createSession();
    }

    public ngOnInit(): void {
        console.log("Ng on init");
        this.rootSubscription = this.route.params.subscribe(params => {
            if (this.services) {
                const urlName = this.getUrlServiceName();
                if (!MsftSme.isNullOrWhiteSpace(urlName)) {
                    this.selectedService = this.services.find((service: ServiceData) => service.name === urlName);
                    if (this.selectedService) {
                        this.onRowSelect(this.selectedService);
                    }
                }
            }
        });
        let serviceNameFromRoute = this.getUrlServiceName();
        this.rootSubscription.add(
            this.servicesService.inventoryQueryCache.createObservable({ params: { nodeName: this.servicesService.nodeName } })
                .flatMap(inventory => {
                    return this.servicesService.servicesQueryCache
                        .createObservable({
                            interval: ServicesComponent.refreshTimeoutinMilliSeconds,
                            delayClean: true,
                            params: { isServerManagerAvailable: inventory.isServerManagerAvailable }
                        });
                }).catch(error => {
                    this.showAlert(Net.getErrorMessage(error), NotificationState.Error);
                    this.loading = false;
                    return Observable.empty();
                }).subscribe((response: ServiceData[]) => {
                    this.services = response;
                    // The following code is to auto-select the service on which
                    // settings was opened and user clicks the back button in settings page
                    if (serviceNameFromRoute) {
                        this.selectedService = <ServiceData>this.services.
                            find((service: ServiceData) => service.name === serviceNameFromRoute);
                        this.onRowSelect(this.selectedService);
                        serviceNameFromRoute = null;
                        this.scrollToSelection();
                    }

                    this.loading = false;

                    // Get previously selected and/or started/stopped service data to update tool bar status.
                    if (this.selectedService) {
                        const previouslySelectedService = <ServiceData>this.services.find((service) =>
                            (<ServiceData>service).name === this.selectedService.name);
                        this.updateServiceStatus(previouslySelectedService);
                        this.updateActionBarButtons(previouslySelectedService);
                        this.selectedService = previouslySelectedService;
                    }
                })
        );
    }

    @Debounce()
    public scrollToSelection() {
        if (this.dataTable) {
            this.dataTable.scrollSelectedItemIntoView(true);
        }
    }

    public ngOnDestroy(): void {
        this.rootSubscription.unsubscribe();
        this.servicesService.disposeSession();
    }

    private getUrlServiceName(): string {
        const snapshot = this.route.snapshot;
        if (snapshot && snapshot.params && snapshot.params['name']) {
            return snapshot.params['name'];
        }

        return null;
    }

    private updateServiceStatus(serviceToUpdate: ServiceData): void {
        this.isServiceRunning = ServiceStatus[serviceToUpdate.status] === ServiceStatus.Running;
        this.isServicePaused = ServiceStatus[serviceToUpdate.status] === ServiceStatus.Paused;
        this.isServiceStopped = ServiceStatus[serviceToUpdate.status] === ServiceStatus.Stopped;
        this.acceptPause = (serviceToUpdate.supportedControlCodes % 4) >= ServiceSupportedControl.AcceptPause;
        this.acceptStop = (serviceToUpdate.supportedControlCodes % 2) >= ServiceSupportedControl.AcceptStop;
        this.isServiceDisabled = serviceToUpdate.startupType === startupTypes[4];
    }

    public onRowSelect(service: ServiceData): void {
        console.log("onRowSelect");
        this.serviceDependencyList = null;
        this.selectedService = service;
        this.updateServiceStatus(this.selectedService);
        this.updateActionBarButtons(this.selectedService);

        const servicesThatDependOnSelectedService = ServicesUtil.getDependentService(this.selectedService, this.services, true);

        // the way the getDependentService is written, the output includes name of the service itself if there are no dependencies.
        // so checking for length 1 instead of 0 to declare no dependency.
        if (servicesThatDependOnSelectedService.length === 1) {
            this.serviceDependencyList = [this.strings.MsftSmeServiceViewer.noDependencies];
        } else {
            servicesThatDependOnSelectedService.pop();
            this.serviceDependencyList = servicesThatDependOnSelectedService;
        }

        this.servicesService.updateUrl(this.selectedService.name);

        this.changeDetectorRef.detectChanges();
    }

    public onRowUnselect(service: any): void {
        this.selectedService = null;
        this.serviceDependencyList = null;
    }

    public configureService(): void {
        this.router.navigate(['/settings', this.selectedService.name]);
    }

    public startStopService(): void {
        const targetService = this.selectedService;
        if (targetService && this.startStopButtonText === this.strings.MsftSmeServiceViewer.startServiceText) {
            this.startService(targetService);
        } else if (targetService && this.startStopButtonText === this.strings.MsftSmeServiceViewer.stopServiceText) {
            this.stopService(targetService);
        }

        this.updateActionBarButtons(targetService);
    }

    public pauseResumeService(): void {
        const targetService = this.selectedService;
        if (targetService && this.pauseResumeButtonText === this.strings.MsftSmeServiceViewer.pauseServiceText) {
            this.pauseService(targetService);
        } else if (targetService && this.pauseResumeButtonText === this.strings.MsftSmeServiceViewer.resumeServiceText) {
            this.resumeService(targetService);
        }

        this.updateActionBarButtons(targetService);
    }

    private updateActionBarButtons(targetService: ServiceData): void {
        if (targetService && this.isServiceStopped && !this.isServiceDisabled) {
            this.startStopButtonText = this.strings.MsftSmeServiceViewer.startServiceText;
            this.startStopButtonIcon = 'sme-icon icon-win-play';
            this.startStopButtonEnabled = true;
        } else if (targetService && this.isServiceRunning && this.acceptStop) {
            this.startStopButtonText = this.strings.MsftSmeServiceViewer.stopServiceText;
            this.startStopButtonIcon = 'sme-icon icon-win-stop';
            this.startStopButtonEnabled = true;
        } else {
            this.startStopButtonEnabled = false;
        }

        if (targetService && this.isServiceRunning && this.acceptPause) {
            this.pauseResumeButtonText = this.strings.MsftSmeServiceViewer.pauseServiceText;
            this.pauseResumeButtonIcon = 'sme-icon icon-win-pause';
            this.pauseResumeButtonEnabled = true;
        } else if (targetService && this.isServicePaused) {
            this.pauseResumeButtonText = this.strings.MsftSmeServiceViewer.resumeServiceText;
            this.pauseResumeButtonIcon = 'sme-icon icon-win-play';
            this.pauseResumeButtonEnabled = true;
        } else {
            this.pauseResumeButtonEnabled = false;
        }
    }

    private startService(targetService: ServiceData): void {
        this.isServiceStopped = false;
        this.showAlert(
            this.strings.MsftSmeServiceViewer.startRunService.format(targetService.displayName),
            NotificationState.Started);
        this.servicesService.startService(targetService)
            .catch((error, caught) => {
                this.showAlert(Net.getErrorMessage(error), NotificationState.Error);
                return this.quitAndUpdateState();
            })
            .flatMap(response => {
                if (response.returnValue !== 0) {
                    this.showAlert(
                        this.strings.MsftSmeServiceViewer.ErrorCodeFromAction.format(response.returnValue),
                        NotificationState.Error);
                    return this.quitAndUpdateState();
                }

                return Observable.of(response)
                    .delay(ServicesComponent.refreshTimeoutinMilliSeconds)
                    .flatMap(() => this.checkServiceStatus(targetService, ServiceStatus.Running));
            })
            .subscribe();
    }

    private stopService(targetService: ServiceData): void {
        const servicesDependingOnSelectedService = ServicesUtil.getDependentService(targetService, this.services, false);
        servicesDependingOnSelectedService.pop();
        let dialogObservable: Observable<ConfirmationListDialogResult>;
        if (servicesDependingOnSelectedService.length === 0) {
            dialogObservable =
                this.dialogService.show<ConfirmationListDialogOptions, ConfirmationListDialogResult>('services-cnfdialog', {
                    cancelButtonText: this.strings.MsftSmeServiceViewer.no,
                    confirmButtonText: this.strings.MsftSmeServiceViewer.confirm,
                    listDataSource: Observable.of(['{0} ({1})'.format(targetService.displayName, targetService.name)]),
                    title: this.strings.MsftSmeServiceViewer.stopConfirmationDialogHeader,
                    listHeaderText:
                    this.strings.MsftSmeServiceViewer.stopConfirmMessage.format
                        (targetService.displayName, targetService.name),
                    listFooterText: ''
                });
        } else {
            dialogObservable =
                this.dialogService.show<ConfirmationListDialogOptions, ConfirmationListDialogResult>('services-cnfdialog', {
                    cancelButtonText: this.strings.MsftSmeServiceViewer.no,
                    confirmButtonText: this.strings.MsftSmeServiceViewer.confirm,
                    listDataSource: Observable.of(servicesDependingOnSelectedService),
                    title: this.strings.MsftSmeServiceViewer.stopConfirmationDialogHeader,
                    listHeaderText:
                    this.strings.MsftSmeServiceViewer.confirmDependencyStopHeader.format
                        (targetService.displayName, targetService.name),
                    listFooterText: this.strings.MsftSmeServiceViewer.confirmDependencyStopFooter
                });
        }

        dialogObservable.flatMap(result => {
            if (!result.confirmed) {
                return this.quitAndUpdateState();
            }

            // Temporarily disable button while action is in progress; button state will be automatically updated after action.
            this.startStopButtonEnabled = false;

            // Proceed with stop action with no-key PowerShell session which dispose the session afterward.
            const session = this.appContextService.powerShell.createSession(this.servicesService.nodeName);
            return this.servicesService.stopService(session, targetService)
                .catch((error, caught) => {
                    this.showAlert(Net.getErrorMessage(error), NotificationState.Error);
                    return this.quitAndUpdateState();
                })
                .delay(ServicesComponent.refreshTimeoutinMilliSeconds)
                .flatMap(response => this.checkServiceStatus(targetService, ServiceStatus.Stopped));
        })
            .subscribe();
    }

    private pauseService(targetService: ServiceData): void {
        this.acceptPause = false;
        this.acceptStop = false;
        this.dialogService.show<ConfirmationListDialogOptions, ConfirmationListDialogResult>('services-cnfdialog', {
            cancelButtonText: this.strings.MsftSmeServiceViewer.no,
            confirmButtonText: this.strings.MsftSmeServiceViewer.confirm,
            listDataSource: Observable.of(['{0}({1})'.format(targetService.displayName, targetService.name)]),
            title: this.strings.MsftSmeServiceViewer.pauseConfirmationDialogHeader,
            listHeaderText:
            this.strings.MsftSmeServiceViewer.pauseConfirmMessage.format(targetService.displayName, targetService.name),
            listFooterText: ''
        })
            .flatMap(result => {
                if (!result.confirmed) {
                    return this.quitAndUpdateState();
                }

                return this.servicesService.pauseService(targetService)
                    .catch((error, caught) => {
                        this.showAlert(Net.getErrorMessage(error), NotificationState.Error);
                        return this.quitAndUpdateState();
                    })
                    .flatMap(response => {
                        if (response.returnValue !== 0) {
                            this.showAlert(
                                this.strings.MsftSmeServiceViewer.ErrorCodeFromAction.format(response.returnValue),
                                NotificationState.Error);
                            return this.quitAndUpdateState();
                        }

                        return Observable.of(response)
                            .delay(ServicesComponent.refreshTimeoutinMilliSeconds)
                            .flatMap(() => this.checkServiceStatus(targetService, ServiceStatus.Paused));
                    });
            })
            .subscribe();
    }

    private resumeService(targetService: ServiceData): void {
        this.isServicePaused = false;
        this.servicesService.resumeService(targetService)
            .catch((error, caught) => {
                this.showAlert(Net.getErrorMessage(error), NotificationState.Error);
                return this.quitAndUpdateState();
            })
            .flatMap(
            response => {
                if (response.returnValue !== 0) {
                    this.showAlert(
                        this.strings.MsftSmeServiceViewer.ErrorCodeFromAction.format(response.returnValue),
                        NotificationState.Error);
                    return this.quitAndUpdateState();
                }

                return Observable.of(response)
                    .delay(ServicesComponent.refreshTimeoutinMilliSeconds)
                    .flatMap(() => this.checkServiceStatus(targetService, ServiceStatus.Running));
            })
            .subscribe();
    }

    private checkServiceStatus(targetService: ServiceData, expectedStatus: ServiceStatus): Observable<any> {
        // we only need to check updated status once, so setting interval to 0.
        return this.servicesService.getService(targetService.name).map(
            response => {
                const item = response && response.properties;
                if (item) {
                    if (ServiceStatus[expectedStatus] !== item.state) {
                        // Status not same as expected may mean either it failed because of non-zero exit code or it is taking
                        // longer than the 5 seconds we wait. Report to the user accordingly.
                        if (item.exitCode !== 0) {
                            this.showAlert(
                                this.strings.MsftSmeServiceViewer.StatusNotInExpectedState.format(item.name, item.exitCode),
                                NotificationState.Error);
                        } else {
                            this.showAlert(
                                this.strings.MsftSmeServiceViewer.CouldNotFinishOperationInSpecifiedTime.format(item.name),
                                NotificationState.Warning);
                        }

                    } else {
                        // notify success
                        this.showAlert(
                            this.strings.MsftSmeServiceViewer.actionSuccess.format(item.displayName, item.state),
                            NotificationState.Success);
                    }

                    this.updateActionBarButtons(this.selectedService);
                }
            }
        );
    }

    private showAlert(message, state: NotificationState): void {
        this.appContextService.notification.alert(this.appContextService.activeConnection.nodeName, state, message);
    }

    private quitAndUpdateState(): Observable<any> {
        this.updateActionBarButtons(this.selectedService);
        return Observable.empty();
    }
}
