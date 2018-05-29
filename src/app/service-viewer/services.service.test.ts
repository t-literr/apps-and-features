import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, ActivatedRouteSnapshot, Params, Router } from '@angular/router';
import { AppContextService, DialogService, ResourceService } from '@msft-sme/shell/angular';
import { ResourceCache } from '@msft-sme/shell/core';
import { TreeNode } from 'primeng/primeng';
import { Observable } from 'rxjs/Observable';
import { AjaxError, AjaxResponse } from 'rxjs/Observable/dom/AjaxObservable';
import { Subject } from 'rxjs/Subject';
import { ServicesComponent } from './services.component';
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

describe('services.service test:', () => {
      it('Get Service should succeed', () => {      
            let serviceName = 'svc';
            let servicesService = new ServicesService(<any>{
                resourceCache: {
                    getStrings: () => {
                        return {};
                    }
                },
                activeConnection : {
                    nodeName: 'node'
                },
                cim: {
                    getInstanceSingle: (nodename: string, namespace: string, className: string, arg0: any, arg1: any): any => {
                        return Observable.of({
                            name: serviceName
                        });
                    }
                }
            });
            spyOn((<any>servicesService).appContext.cim, 'getInstanceSingle').and.callThrough();
            (<any>servicesService).getService(serviceName).subscribe(result => {
                expect(result).not.toBeNull('There should be valid result returned');                     
                expect(result.name).toEqual(serviceName, `There should be a service with name ${serviceName}`);                
            });

            expect((<any>servicesService).appContext.cim.getInstanceSingle).toHaveBeenCalled();
    });    
});