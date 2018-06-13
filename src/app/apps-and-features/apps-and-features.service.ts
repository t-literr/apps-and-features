// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Injectable } from '@angular/core';
import { AppContextService } from '@microsoft/windows-admin-center-sdk/angular';
import { PowerShell, PowerShellSession } from '@microsoft/windows-admin-center-sdk/core';
import { Observable } from 'rxjs';
import { PowerShellScripts } from '../../generated/powerShell-scripts';
import { Strings } from '../../generated/strings';
import { AppData } from './apps-and-features-data';

@Injectable()
export class AppsAndFeaturesService {
    public static psKey = 'sme.seed';
    private psSession: PowerShellSession;
    public strings = MsftSme.resourcesStrings<Strings>();

    constructor(private appContextService: AppContextService) {
    }

    /**
     *  This method illustrates how to execute a PowerShell script within the context of SME / Honolulu.
     */
    public getApps(session: PowerShellSession): Observable<any[]> {
        let command = PowerShell.createScript(PowerShellScripts.Get_Service);
        return this.appContextService.powerShell.run(session, command)
            .map(response => {
                const result: AppData[] = [];
                if (response) {
                    for (const item of response.results) {
                        if (item) {
                            const data: AppData = {
                                displayName: item.name,
                                publisher: item.vendor,
                                prodID: item.identifyingNumber,
                                version: item.version,
                                installDate: this.formatDate(item.installDate)
                            };
                            if (data.displayName != null) {
                                result.push(data);
                            }
                        }
                    }
                }
                return result;
            });
    }

    public formatDate(date: string) {
        if (date != null) {
            let day = date.substring(6);
            let month = date.substring(4, 6);
            let year = date.substring(0, 4);
            return this.strings.date.format(month, day, year);
        }
        return '';
    }

    public removeApp(session: PowerShellSession, productID: string): Observable<any[]> {
        let command = PowerShell.createScript(PowerShellScripts.Get_Process, { prodID: productID });
        return this.appContextService.powerShell.run(session, command);
    }
}
