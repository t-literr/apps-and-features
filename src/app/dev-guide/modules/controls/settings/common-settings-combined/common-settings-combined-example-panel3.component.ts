// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { Subscription } from 'rxjs/Subscription';

import { CommonSettingsCombinedExamplePanelBaseComponent } from './common-settings-combined-example-panel-base.component';

import { CombinedSetting3Model } from './model/combined-setting3-model';

@Component({
    selector: 'sme-ng3-controls-common-settings-combined-example-panel3',
    templateUrl: './common-settings-combined-example-panel3.component.html'
})
export class CommonSettingsCombinedExamplePanel3Component
    extends CommonSettingsCombinedExamplePanelBaseComponent<CombinedSetting3Model>
    implements OnInit {
    constructor(router: Router, activatedRoute: ActivatedRoute, formbuilder: FormBuilder) {
        super(
            router,
            activatedRoute,
            formbuilder);

        this.init(
            {
                name3: ''
            },
            {
                name3: {
                    required: 'this is a mandatory field'
                }
            },
            {
                name3: 'setting 3 name value'
            },
            'setting 3');
    }

    public ngOnInit() {
        this.sampleForm = this.formbuilder.group({
            name3: [this.modelData.name3, Validators.required]
        });

        super.ngOnInit();
    }
}
