// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AppContextService,
        CheckValidationEventArgs,
        ConfirmationDialogResult,
        DialogService,
        ValidationAlerts,
        ValidationAlertSeverity
} from '@msft-sme/shell/angular';
import { ClientNotification,
        ClientNotificationType,
        Logging,
        LogLevel,
        Net,
        NotificationState,
        PowerShellSession } from '@msft-sme/shell/core';
import { start } from 'repl';
import { Observable } from 'rxjs';
import { AjaxError } from 'rxjs/observable/dom/AjaxObservable';
import { IfObservable } from 'rxjs/observable/IfObservable';
import { Subscription } from 'rxjs/Subscription';
import { PowerShellScripts } from '../../generated/powerShell-scripts';
import { Strings } from '../../generated/strings';
import { AppData } from './apps-and-features-data';
import { AppsAndFeaturesService } from './apps-and-features.service';
import { AppNotifications } from './apps-notifications';

@Component({
    selector: 'sme-apps-and-features',
    templateUrl: './apps-and-features.component.html'
})
export class AppsAndFeaturesComponent extends AppNotifications implements OnInit, OnDestroy {
    public loading = true;
    public errorMessage: string;
    public strings = MsftSme.resourcesStrings<Strings>();

    // needed for ps function
    private appSubscription: Subscription;
    private psSession: PowerShellSession;
    public apps: AppData[];

    public selectedApps: AppData[];
    public selection: AppData;

    constructor(private appContextService: AppContextService,
        private appsService: AppsAndFeaturesService) {
        super(appContextService, appsService)
        this.strings = MsftSme.resourcesStrings<Strings>();
        this.selectedApps = [];
        this.selection = null;
    }

    public ngOnInit(): void {
        this.psSession = this.appContextService.powerShell.createSession(this.appContextService.activeConnection.nodeName);
        this.getApps();
    }
    public ngOnDestroy() {
        this.psSession.dispose();
    }

    // reload page in the event an app is removed
    public refresh() {
        console.log('hit refresh')
        this.loading = true;
        this.getApps();
    }

    public singleSelect(selected: AppData) {
        this.selection = selected;
    }

    /*
    //  Initiates powershell script to retrieve list of all currently installed applications
    */
    private getApps() {
        this.appSubscription = this.appsService.getApps(this.psSession).subscribe(
            (result: any) => {
                this.loading = false;
                if (result) {
                    this.apps = result
                }
            },
            (error: AjaxError) => {
                this.errorMessage = Net.getErrorMessage(error);
                this.loading = false;
            }
        );
    }

    /*
    // Join all names of selected apps with commas to pass to confirmation dialogue
    */
    public listSelected(): string {
        let names = []
        this.selectedApps.forEach(element => {
            names.push(element.displayName)
        });
        return names.join(', ');
    }

    /*
    //  Uninstall the selected application
    */
    public removeSelected(): void {
        // issue notifications while remove is processing
        let removeStrings = this.strings.remove;

        // double check user really wants to remove selected application
        this.appContextService.frame.showDialogConfirmation({
            confirmButtonText: this.strings.yes,
            cancelButtonText: this.strings.cancel,
            title: this.strings.removeApp,
            message: this.strings.areYouSureRemove.format(this.listSelected())
        }).switchMap((result: ConfirmationDialogResult) => {
            this.loading = true;
            if (result.confirmed) {
                this.selectedApps.forEach(element => {
                    let notifSettings = this.createClientNotification(removeStrings.title.format(element.displayName),
                                                                      removeStrings.description.format(element.displayName),
                                                                      removeStrings.description.format(element.displayName));
                    // ok to start notifications because remove process has now started
                    let notif = this.appContextService.notification.notify(
                            this.appContextService.gateway.gatewayName, notifSettings
                    );

                    this.appSubscription = this.appsService.removeApp(this.psSession, element.prodID).subscribe(
                        (resultApps: any) => {
                            this.updateNotification(
                                notif, notifSettings,
                                removeStrings.success.format(this.selection.displayName),
                                NotificationState.Success
                            );
                            this.apps.remove(element)
                            this.selectedApps.remove(element)
                            this.refresh()
                        },
                        (error: AjaxError) => {
                            this.loading = false;
                            console.log('reached error 1')
                            this.updateNotification(
                                notif, notifSettings,
                                removeStrings.error.format(this.selection.displayName, Net.getErrorMessage(error)),
                                NotificationState.Error
                            );
                        }
                    );
                });
            } else {
                this.loading = false;
            }
            return Observable.empty();
        })
        .subscribe(
            (removeResult) => {
                if (removeResult) {
                    console.log('do I ever get here?')
                }
            },
            error => {
                this.appContextService.notification.alert(
                    this.appContextService.activeConnection.nodeName,
                    NotificationState.Error,
                    Net.getErrorMessage(error));
                this.loading = false;
                console.log('reached error 2')
            }
        );
    }

}
