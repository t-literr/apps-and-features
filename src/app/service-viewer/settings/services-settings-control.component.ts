import { Component } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router';
import {
    AppContextService,
    CommonSettingsComponentBase,
    CommonSettingsNavigationItem,
    ConfirmationDialogOptions
} from '@msft-sme/shell/angular';
import { Strings } from '../../../generated/strings';

@Component({
    selector: 'sme-services-settings-control',
    templateUrl: './services-settings-control.component.html'
})
export class ServicesSettingsControlComponent extends CommonSettingsComponentBase {
    public strings = this.appContextService.resourceCache.getStrings<Strings>().MsftSmeServiceViewer;
    public settingItems: CommonSettingsNavigationItem[] = [];
    public title: string;

    public static navigationTitle(appContextService: AppContextService, snapshot: ActivatedRouteSnapshot): string {
        return MsftSme.replaceAll(snapshot.params['name'], '%20', ' ');
    }

    constructor(private appContextService: AppContextService, protected activatedRoute: ActivatedRoute) {
        super();
        this.title = decodeURI(this.strings.Settings.Title.format(activatedRoute.snapshot.params['name']));
        this.settingItems.push(
            {
                label: this.strings.Settings.General.Tab,
                routeParams: {
                    commands: ['general']
                },
                smeIconClassName: ''
            },
            {
                label: this.strings.Settings.Logon.Tab,
                routeParams: {
                    commands: ['logon']
                },
                smeIconClassName: ''
            },
            {
                label: this.strings.Settings.Recovery.Tab,
                routeParams: {
                    commands: ['recovery']
                },
                smeIconClassName: ''
            }
            // uncomment when dependencies settings are completed
            // {
            //     label: this.strings.Settings.Dependencies.Tab,
            //     routeParams: {
            //         commands: ['dependencies']
            //     },
            //     smeIconClassName: ''
            // }
        );
    }

    public confirmContinueEditingDialogOptions(
        dirtyForm: FormGroup,
        allForms: FormGroup[]): ConfirmationDialogOptions {
        return {
            cancelButtonText: this.strings.discardChanges,
            confirmButtonText: this.strings.continueChanges,
            message: this.strings.unsavedMessage,
            title: this.strings.unsavedChanges
        };
    }
}
