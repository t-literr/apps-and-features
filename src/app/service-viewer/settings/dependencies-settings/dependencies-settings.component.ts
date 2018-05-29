import { Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AppContextService } from '@msft-sme/shell/angular';
import { ServicesService } from '../../services.service';
import { ServicesSettingsBase } from '../services-settings-base'

@Component({
    selector: 'sme-services-dependencies-settings',
    templateUrl: './dependencies-settings.component.html'
})
export class DependenciesSettingsComponent extends ServicesSettingsBase {
    constructor(
        appContextService: AppContextService,
        servicesService: ServicesService,
        router: Router,
        activatedRoute: ActivatedRoute,
        formBuilder: FormBuilder) {
        super(appContextService, servicesService, router, activatedRoute, formBuilder);
    }

    public onSaveClick() {
        // implement
    }

    public onDiscardClick() {
        // implement
    }
}
