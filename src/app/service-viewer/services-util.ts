import { CimResult } from '@msft-sme/shell/core';
import {
    ServiceClassificationData,
    ServiceData,
    ServiceFlags,
    ServiceStartupType,
    ServiceStatus,
    ServiceSupportedControl,
    startupTypes
} from './services.data';

export class ServicesUtil {

    public static getServices(response: any): ServiceData[] {
        const result: ServiceData[] = [];
        if (response) {
            for (const item of response) {
                if (item) {
                    const data: ServiceData = {
                        name: item.name,
                        displayName: item.displayName,
                        status: ServiceStatus[item.status],
                        startupType: startupTypes[this.getServiceStartupType(item)],
                        description: item.description,
                        supportedControlCodes: item.supportedControlCodes,
                        // The dependentServices get from GetServerServiceDetail() method really is 
                        //  antecedent services this service will depend on
                        antecedentServices: item.dependentServices
                    };
                    result.push(data);
                }
            }
        }
        return result;
    }

    /**
     * Get all services which depend on the selectedService, it may contain nested services
     * @param selectedService target service
     * @param services all services data
     * @param ignoreStatus boolean, ignore running status or not
     */
    public static getDependentService(selectedService: ServiceData, services: ServiceData[], ignoreStatus: boolean): string[] {
        const servicesDependingOnSelectedService: string[] = [];
        let currentDependentServiceList: string[] = [];
        let tempList: string[] = [selectedService.name];

        while (tempList.length > 0) {
            currentDependentServiceList = [];

            tempList.forEach((item) => {
                servicesDependingOnSelectedService.push(item);
            });

            // Generate the new tempList and remove wrong order item from servicesDependingOnSelectedService
            // This iteration and the above one must be separated.
            tempList.forEach((item) => {

                // Put all running services that depends on current service to temp list
                services.forEach((serviceItem) => {
                    const serviceItemName = serviceItem.name;

                    if (!ignoreStatus) {
                        if (serviceItem.antecedentServices.indexOf(item) >= 0
                            && ServiceStatus[serviceItem.status] === ServiceStatus.Running
                            && currentDependentServiceList.indexOf(serviceItemName) < 0) {
                            currentDependentServiceList.push(serviceItemName);

                            // If service is in the final list, remove it from the final list since its order is wrong
                            if (servicesDependingOnSelectedService.indexOf(serviceItemName) > 0) {
                                servicesDependingOnSelectedService.remove(serviceItemName);
                            }
                        }
                    } else {
                        if (serviceItem.antecedentServices.indexOf(item) >= 0
                            && currentDependentServiceList.indexOf(serviceItemName) < 0) {
                            currentDependentServiceList.push(serviceItemName);

                            // If service is in the final list, remove it from the final list since its order is wrong
                            if (servicesDependingOnSelectedService.indexOf(serviceItemName) > 0) {
                                servicesDependingOnSelectedService.remove(serviceItemName);
                            }
                        }
                    }

                });
            });

            tempList = currentDependentServiceList;
        }

        // Create friendly name like "display name (servicename)" and reverse the list to get the correct order.
        const finalDependencyList: string[] = [];
        servicesDependingOnSelectedService.forEach(dependent => {
            services.forEach(service => {
                if (dependent === service.name) {
                    finalDependencyList.push('{0} ({1})'.format(service.displayName, service.name));
                }
            });
        });
        return finalDependencyList.reverse();
    }

    private static getServiceStartupType(item: any): ServiceStartupType {
        if (item.startupType === ServiceStartupType.Auto) {
            if (item.isDelayedAutoStart) {
                return item.isTriggered ? ServiceStartupType.AutomaticTriggeredDelayed : ServiceStartupType.DelayedAuto;
            } else {
                return item.isTriggered ? ServiceStartupType.AutomaticTriggered : ServiceStartupType.Auto;
            }
        } else if (item.startupType === ServiceStartupType.Demand) {
            return item.isTriggered ? ServiceStartupType.DemandTriggered : ServiceStartupType.Demand;
        }
        return item.startupType;
    }

}