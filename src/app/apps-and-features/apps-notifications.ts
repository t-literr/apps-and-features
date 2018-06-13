import { OnDestroy, OnInit } from '@angular/core';
import { AjaxError, Observable, Subscription } from 'rxjs';

import { AppContextService } from '@microsoft/windows-admin-center-sdk/angular';
import { ClientNotification,
         ClientNotificationType,
         Net,
         NotificationState,
         PowerShellSession,
         RpcShellNavigate } from '@microsoft/windows-admin-center-sdk/core';

import { AppsAndFeaturesService } from './apps-and-features.service';

import { Strings } from '../../generated/strings';

export abstract class AppNotifications implements OnInit, OnDestroy {
    protected subscriptions: Subscription[] = [];
    public strings: Strings;

    constructor(
        protected appContext: AppContextService,
        protected scheduledTasksService: AppsAndFeaturesService) {
            this.strings = this.appContext.resourceCache.getStrings<Strings>();
    }

    public ngOnInit() {
     // TODO: see if needed. Possibly load all tasks here.
    }

    public ngOnDestroy() {
        this.subscriptions.forEach(subscription => subscription.unsubscribe());
    }

    /**
     * update client notification on completion
     * @param notification
     * @param clientNotification
     * @param message
     * @param state
     */
    public updateNotification(notification: Observable<any>,
        clientNotification: ClientNotification,
        message: string,
        state: NotificationState) {
        notification.flatMap(() => {
            clientNotification.message = message;
            clientNotification.state = state;
            return this.appContext.notification.notify(this.appContext.gateway.gatewayName, clientNotification);
        }).subscribe();
    }

    /**
     * display error alert
     * @param error error object, if AjaxError extracts error message
     */
    public showErrorAlert(title: string, description: string, error: any) {
        let message = (error as AjaxError) ? Net.getErrorMessage(error as AjaxError) : error;
        let clientNotification: ClientNotification = {
            type: ClientNotificationType.NotificationCenter,
            id: MsftSme.getUniqueId(),
            title: title,
            description: description,
            message: error,
            state: NotificationState.Error
        };

        this.appContext.notification.notify(this.appContext.gateway.gatewayName, clientNotification);
    }

    /**
     * display informational alert
     * @param message
     */
    public showInformationalAlert(title: string, description: string, message: string) {
        let clientNotification: ClientNotification = {
            type: ClientNotificationType.NotificationCenter,
            id: MsftSme.getUniqueId(),
            title: title,
            description: description,
            message: message,
            state: NotificationState.Informational
        };

        this.appContext.notification.notify(this.appContext.gateway.gatewayName, clientNotification );
    }

    /**
     * creates a client notification instance
     * @param title
     * @param description
     * @param message
     */
    public createClientNotification(title: string, description: string, message: string): ClientNotification {
        let clientNotification: ClientNotification = {
                    type: ClientNotificationType.NotificationCenter,
                    id: MsftSme.getUniqueId(),
                    title: title,
                    description: description,
                    message: message,
                    state: NotificationState.InProgress
                };

        return clientNotification;
    }
}
