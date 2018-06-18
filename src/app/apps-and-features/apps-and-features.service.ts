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

    /*
     *  This method retrieves all modern apps installed on the current node.
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
                            // check if display name and publisher name are valid from manifest file
                            // if they contain ms-resource, someone forgot to fill in that field and you
                            // have to use the default value returned from get-appxpackage
                            if (item.displayName.indexOf('ms-resource') !== -1) {
                                item.displayName = item.name
                            }
                            if (item.publisherDisplayName.indexOf('ms-resource') !== -1) {
                                item.publisherDisplayName = this.formatPublisher(item.publisher)
                            }
                            const data: AppData = {
                                displayName: item.displayName,
                                publisher: item.publisherDisplayName,
                                prodID: item.identifyingNumber,
                                version: item.version,
                                installDate: this.formatDate(item.installDate),
                                size: item.size
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

    /*
     *  convert date to day/month/year
     *  original example: 2018-06-15T12:41:14.2387281-07:00
     */
    public formatDate(date: string) {
        let spliced = date.split('-')
        if (date != null) {
            let day = spliced[2].substring(0, 2);
            let month = spliced[1];
            let year = spliced[0];
            return this.strings.date.format(month, day, year);
        }
        return '';
    }

    /*
     *  remove excess information and extract publisher name
     *  ex: "CN=Microsoft Corporation, O=Microsoft Corporation, L=Redmond, S=Washington, C=US"
     */
    public formatPublisher(publisher: string) {
        if (publisher != null) {
            let firstEntry = publisher.split(',')[0];
            return firstEntry.split('=')[1];
        }
        return '';
    }

    /*
     *  This method uninstalls all selected apps in the current node.
     */
    public removeApp(session: PowerShellSession, packageName: string): Observable<any[]> {
        let command = PowerShell.createCommand(PowerShellScripts.Get_Process, { packageName: packageName });
        return this.appContextService.powerShell.run(session, command);
    }
}
