// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Injectable } from '@angular/core';
import { AppContextService } from '@msft-sme/shell/angular';
import { PowerShell, PowerShellSession } from '@msft-sme/shell/core';
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
        let command = PowerShell.createCommand(PowerShellScripts.Get_Service);
        return this.appContextService.powerShell.run(session, command)
            .map(response => {
                const result: AppData[] = [];
                if (response) {
                    console.log(response)
                    for (const item of response.results) {
                        if (item) {
                            const data: AppData = {
                                displayName: item.name,
                                publisher: this.formatPublisher(item.publisher),
                                prodID: item.identifyingNumber,
                                version: item.version,
                                installDate: this.formatDate(item.installDate),
                                installLocation: item.installLocation
                            };
                            if (data.displayName != null) {
                                result.push(data);
                            }
                            if (item.name === '89006A2E.AutodeskSketchBook') {
                                console.log(item)
                            }
                        }
                    }
                }
                return result;
            });
    }

    // convert date to month/day/year
    public formatDate(date: string) {
        if (date != null) {
            let day = date.substring(6);
            let month = date.substring(4, 6);
            let year = date.substring(0, 4);
            return this.strings.date.format(month, day, year);
        }
        return '';
    }

    // remove excess information and extract publisher name
    // ex: "CN=Microsoft Corporation, O=Microsoft Corporation, L=Redmond, S=Washington, C=US"
    public formatPublisher(publisher: string) {
        if (publisher != null) {
            let firstEntry = publisher.split(',')[0];
            return firstEntry.split('=')[1];
        }
        return '';
    }

    public removeApp(session: PowerShellSession, packageName: string): Observable<any[]> {
        let command = PowerShell.createCommand(PowerShellScripts.Get_Process, { packageName: packageName });
        return this.appContextService.powerShell.run(session, command);
    }
}
