import { Injectable } from '@angular/core';
import { AppContextService } from '@msft-sme/shell/angular';
import {
    Cim, CimResult, PowerShell, PowerShellOptions, PowerShellSession, QueryCache, RpcReportData, ServerInventory, ServerInventoryCache
} from '@msft-sme/shell/core';
import { Observable } from 'rxjs/Observable';
import { PowerShellScripts } from '../../generated/powershell-scripts';
import { Strings } from '../../generated/strings';
import { ServicesUtil } from './services-util';
import { ServiceClassificationData, ServiceData, ServiceFlags } from './services.data';
import { FailureAction, ServiceRecoverySettings } from './settings/recovery-settings/recovery-settings.component'

export interface NodeNameParams {
    nodeName: string;
}

export interface AvailableParams {
    isServerManagerAvailable: boolean;
}

export interface ServiceParams {
    serviceName: string;
}

@Injectable()
export class ServicesService {
    // Defines a session shared key within the module.
    public static psKey = 'sme.apps-and-features';
    private inventoryCache: ServerInventoryCache;
    public inventoryQueryCache = new QueryCache<ServerInventory, NodeNameParams>(
        params => this.createServerInventory(params),
        params => params.nodeName);
    public servicesQueryCache = new QueryCache<ServiceData[], AvailableParams>(
        params => this.createGetServices(params),
        params => '');
    public recoveryOptionsQueryCache = new QueryCache<any, ServiceParams>(
        params => this.getRecoveryOptions(params.serviceName),
        params => params.serviceName);
    public startPathQueryCache = new QueryCache<any, ServiceParams>(
        params => this.getStartPath(params.serviceName),
        params => params.serviceName);
    public logOnOptionsQueryCache = new QueryCache<any, ServiceParams>(
        params => this.getLogOnOptions(params.serviceName),
        params => params.serviceName);
    private strings: Strings = this.appContext.resourceCache.getStrings<Strings>();
    private psSession: PowerShellSession;

    constructor(private appContext: AppContextService) {
        // WMI providers won't usually change frequently, say in less than 10 minutes.
        // So cache this information for that amount of time.
        const expiration = 10 * 60 * 1000;
        this.inventoryCache = new ServerInventoryCache(this.appContext, { expiration });
    }
    /**
     * Create a powershell session.
     */
    public createSession(): void {
        this.psSession = this.appContext.powerShell.createSession(this.appContext.activeConnection.nodeName, ServicesService.psKey);
    }

    /**
     * Dispose the powershell session.
     */
    public disposeSession(): void {
        if (this.psSession) {
            this.psSession.dispose();
            this.psSession = null;
        }
    }

    public get nodeName(): string {
        return this.appContext.activeConnection.nodeName;
    }

    public updateUrl(name: string): Promise<any> {
        return this.appContext.rpc.report(<RpcReportData>{
            path: '/name/{0}'.format(name),
            beforeRedirectedPath: '/name/{0}'.format(name),
            selectablePath: [
                {
                    label: name,
                    path: '/name/{0}'.format(name),
                    params: []
                }
            ]
        });
    }

    private createServerInventory(params: NodeNameParams): Observable<ServerInventory> {
        return this.inventoryCache.query({ name: params.nodeName }).map(inventory => inventory.instance);
    }

    private createGetServices(params: AvailableParams): Observable<ServiceData[]> {
        if (params.isServerManagerAvailable) {
            return this.appContext.cim.invokeMethodStatic(
                this.nodeName,
                Cim.namespace.serverManager,
                Cim.cimClass.msftServerManagerTasks,
                'GetServerServiceDetail',
                null,
                { powerShell: PowerShellScripts.Get_CimServiceDetail })
                .map(response => ServicesUtil.getServices(response.results));
        } else {
            const command = PowerShellScripts.Get_ServiceList;
            const psSession = this.appContext.powerShell.createSession(this.appContext.connectionManager.activeConnection.name);
            return this.appContext.powerShell.run(psSession, command)
                .map(response => ServicesUtil.getServices(response.results));
        }
    }

    public getService(serviceName: string): Observable<any> {
        return this.appContext.cim.getInstanceSingle(
            this.nodeName,
            Cim.namespace.cimV2,
            Cim.cimClass.win32Service,
            { name: serviceName },
            { powerShell: PowerShellScripts.Get_CimSingleService });
    }

    public startService(service: ServiceData): any {
        return this.appContext.cim.invokeMethodInstance(
            this.nodeName,
            Cim.namespace.cimV2,
            Cim.cimClass.win32Service,
            'StartService',
            { name: service.name },
            null,
            { powerShell: PowerShellScripts.Start_CimService, logAudit: true, logTelemetry: true });
    }

    public stopService(psSession: PowerShellSession, service: ServiceData): any {
        const command = PowerShell.createCommand(PowerShellScripts.Stop_ServiceByName,  { name: service.name });
        return this.appContext.powerShell.run(psSession, command, { logAudit: true, logTelemetry: true });
    }

    public pauseService(service: ServiceData): any {
        return this.appContext.cim.invokeMethodInstance(
            this.nodeName,
            Cim.namespace.cimV2,
            Cim.cimClass.win32Service,
            'PauseService',
            { name: service.name },
            null,
            { powerShell: PowerShellScripts.Suspend_CimService });
    }

    public resumeService(service: ServiceData): any {
        return this.appContext.cim.invokeMethodInstance(
            this.nodeName,
            Cim.namespace.cimV2,
            Cim.cimClass.win32Service,
            'ResumeService',
            { name: service.name },
            null,
            { powerShell: PowerShellScripts.Resume_CimService });
    }

    public getServiceClassificationData(): ServiceClassificationData[] {
        let serviceClassificationData: ServiceClassificationData[] = [];
        serviceClassificationData.push(
            {
                header: this.strings.MsftSmeServiceViewer.descriptionHeader,
                property: 'description',
                flag: ServiceFlags.DescriptionTab,
                selected: false
            },
            {
                header: this.strings.MsftSmeServiceViewer.descriptionHeader,
                property: 'dependentServices',
                flag: ServiceFlags.DependenciesTab,
                selected: false
            }
        );
        return serviceClassificationData;
    }

    public setRecoveryOptions(serviceName: string, recoverySettings: ServiceRecoverySettings) {
        let params = {
            serviceName: serviceName,
            firstFailureAction: recoverySettings.firstFailureAction,
            secondFailureAction: recoverySettings.secondFailureAction,
            thirdFailureAction: recoverySettings.thirdFailureAction,
            resetFailCountDays: recoverySettings.resetFailCountInterval,
            restartServiceMinutes: recoverySettings.restartServiceInterval,
            pathToProgram: recoverySettings.pathToProgram,
            programParameters: recoverySettings.programParameters
        }

        const command = PowerShell.createCommand(PowerShellScripts.Set_ServiceRecoveryOptions, params);
        const psSession = this.appContext.powerShell.createSession(this.appContext.connectionManager.activeConnection.name);
        return this.appContext.powerShell.run(psSession, command)
            .map(response => {
                return response && response.results && response.results.length > 0 ? response.results[0] : null;
            });
    }

    public getRecoveryOptions(serviceName: string): Observable<ServiceRecoverySettings> {
        const command = PowerShell.createCommand(
            PowerShellScripts.Get_ServiceRecoveryOptions, { serviceName: serviceName });
        const psSession = this.appContext.powerShell.createSession(this.appContext.connectionManager.activeConnection.name);
        return this.appContext.powerShell.run(psSession, command)
            .map(response => {
                if (response && response.results && response.results.length > 0) {
                    let results = response.results[0];
                    return {
                        firstFailureAction: results.firstFailure === 'none' || results.firstFailure === null ?
                            '' : results.firstFailure,
                        secondFailureAction: results.secondFailure === 'none' || results.secondFailure === null ?
                            '' : results.secondFailure,
                        thirdFailureAction: results.thirdFailure === 'none' || results.thirdFailure === null ?
                            '' : results.thirdFailure,
                        resetFailCountInterval: results.resetFailCountInterval,
                        restartServiceInterval: results.restartServiceInterval,
                        pathToProgram: results.pathToProgram,
                        programParameters: results.programParameters
                    };
                }
                return null;
            });
    }

    public getStartPath(serviceName: string): Observable<any> {
        const command = PowerShell.createCommand(PowerShellScripts.Get_ServiceImagePath, { serviceName: serviceName });
        const psSession = this.appContext.powerShell.createSession(this.appContext.connectionManager.activeConnection.name);
        return this.appContext.powerShell.run(psSession, command).map(response => {
            return response && response.results && response.results.length > 0 ? response.results[0] : null;
        });
    }

    public setStartOptions(serviceName: string, startupType: string, path: string): Observable<any> {
        const command = PowerShell.createCommand(
            PowerShellScripts.Set_ServiceStartOptions,
            { serviceName: serviceName, path: path, startupType: startupType });
        const psSession = this.appContext.powerShell.createSession(this.appContext.connectionManager.activeConnection.name);
        return this.appContext.powerShell.run(psSession, command).map(response => {
            return response && response.results && response.results.length > 0 ? response.results[0] : null;
        });
    }

    public getLogOnOptions(serviceName: string) {
        const command = PowerShell.createCommand(PowerShellScripts.Get_ServiceLogOnUser, { serviceName: serviceName });
        const psSession = this.appContext.powerShell.createSession(this.appContext.connectionManager.activeConnection.name);
        return this.appContext.powerShell.run(psSession, command).map(response => {
            return response && response.results && response.results.length > 0 ? response.results[0] : null;
        });
    }

    public setLogOnOptions(serviceName: string,  username: string, password: string) {
        const command = PowerShell.createCommand(
            PowerShellScripts.Set_ServiceLogOnUser,
            { serviceName: serviceName, username: username, password: password });
        const psSession = this.appContext.powerShell.createSession(this.appContext.connectionManager.activeConnection.name);
        return this.appContext.powerShell.run(psSession, command).map(response => {
            return response && response.results && response.results.length > 0 ? response.results[0] : null;
        });
    }
}
