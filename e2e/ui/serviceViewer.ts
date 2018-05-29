let strings = require('../../assets/strings/strings.json');

import { ActionPane, BaseUI, DropdownList, TestManager, UIObject, Utils } from '@msft-sme/shell/e2e';
import { WebElement } from 'selenium-webdriver'

export class ServiceViewer extends BaseUI {
    public async startServiceAsync(serviceName: string): Promise<void> {
        this.logActionStart('startServiceAsync', serviceName);
        await this.dataTable.selectItemByCellTextAsync('Name', serviceName);
        await this.actionBar.clickActionButtonAsync('Start');
        await Utils.waitAsync(async () => {
            let newStatus = await this.dataTable.getCellTextInSelectedItemAsync('Status');
            return newStatus === 'Running';
        },                    'Wait for the service to start.');
        this.logActionEnd('startServiceAsync');
    }

    public async stopServiceAsync(serviceName: string): Promise<void> {
        this.logActionStart('stopServiceAsync', serviceName);
        await this.dataTable.selectItemByCellTextAsync('Name', serviceName);
        await this.actionBar.clickActionButtonAsync('Stop');
        await this.confirmationDialog.yesButton.clickAsync();
        await Utils.waitAsync(async () => {
            let newStatus = await this.dataTable.getCellTextInSelectedItemAsync('Status');
            return newStatus === 'Stopped';
        },                    'Wait for the service to stop.');
        this.logActionEnd('stopServiceAsync');
    }

    public async getServiceStartupModeAsync(serviceName: string): Promise<string> {
        this.logActionStart('getServiceStartupModeAsync', serviceName);
        await this.dataTable.selectItemByCellTextAsync('Name', serviceName);
        let status = await this.dataTable.getCellTextInSelectedItemAsync('Startup Mode');
        this.logActionEnd('getServiceStartupModeAsync', status);
        return status;
    }

    public async setServiceStartupModeAsync(serviceName: string, startupMode: string): Promise<void> {
        this.logActionStart('setServiceStartupModeAsync', serviceName + ' | ' + startupMode);
        await this.dataTable.selectItemByCellTextAsync('Name', serviceName);
        await this.actionBar.clickActionButtonAsync('Settings');
        let saveButton = new UIObject(this, { name: 'Save button', selector: 'sme-settings-footer button.btn-primary' });
        let closeButton = new UIObject(this, {
            name: 'Close button', selector: 'sme-settings-footer button.btn-secondary', customSelectorHandler: async webElement => {
                let text = await Utils.getTextAsync(webElement);
                return text === 'Close';
            }
        });

        await Utils.retryAsync(async () => {
            let dropdownList = new DropdownList(this, { name: 'dropdown list', selector: 'select[formcontrolname="startupType"]' });
            await dropdownList.selectTextAsync(startupMode);
            await Utils.sleepAsync(3000);
            await saveButton.clickAsync();
        },                     'Try to set the startup mode to be ' + startupMode);
        await TestManager.currentInstance.shell.switchToTopFrameAsync();
        await TestManager.currentInstance.shell.alertBar.waitForAlertByTextAsync(
            strings.Strings.MsftSmeServiceViewer.Settings.General.SuccessNotification);
        await TestManager.currentInstance.shell.switchToToolIFrameAsync();
        await closeButton.clickAsync();
        await Utils.waitAsync(async () => {
            await this.dataTable.selectItemByCellTextAsync('Name', serviceName);
            let currentStartupMode = await this.dataTable.getCellTextInSelectedItemAsync('Startup Mode');
            return startupMode.indexOf(currentStartupMode) === 0;
        },                    'Wait for the Startup Mode to be changed to ' + startupMode);

        this.logActionEnd('setServiceStartupModeAsync');
    }

    public async getRecoveryAction(serviceName: string): Promise<string> {
        this.logActionStart('getRecoveryAction', serviceName);
        await this.dataTable.selectItemByCellTextAsync('Name', serviceName);
        await this.actionBar.clickActionButtonAsync('Settings');

        let closeButton = new UIObject(this, {
            name: 'Close button', selector: 'sme-settings-footer button.btn-secondary', customSelectorHandler: async webElement => {
                let text = await Utils.getTextAsync(webElement);
                return text === 'Close';
            }
        });

        const tabName = strings.Strings.MsftSmeServiceViewer.Settings.Recovery.Tab;
        await Utils.waitAsync(
            async (): Promise<boolean> => !!(await Utils.findElementAsync('span.ellipsis', tabName)),
            'Wait for {0} tab to load'.format(tabName));

        const tabButton = await Utils.findElementAsync('span.ellipsis', tabName);
        await Utils.clickAsync(tabButton);

        let actionName = '';
        await Utils.retryAsync(
            async () => {
                let dropdownList = new DropdownList(
                    this,
                    { name: 'dropdown list', selector: 'select[formcontrolname="firstFailureAction"]' });
                actionName = await dropdownList.getSelectedTextAsync();
            },
            'Try to get the failure action.');

        await closeButton.clickAsync();

        this.logActionEnd('getRecoveryAction', actionName);

        return actionName;
    }

    public async setRecoveryAction(serviceName: string, actionName: string): Promise<void> {
        this.logActionStart('setRecoveryAction', serviceName + '|' + actionName);
        await this.dataTable.selectItemByCellTextAsync('Name', serviceName);
        await this.actionBar.clickActionButtonAsync('Settings');

        let saveButton = new UIObject(this, { name: 'Save button', selector: 'sme-settings-footer button.btn-primary' });
        let closeButton = new UIObject(this, {
            name: 'Close button', selector: 'sme-settings-footer button.btn-secondary', customSelectorHandler: async webElement => {
                let text = await Utils.getTextAsync(webElement);
                return text === 'Close';
            }
        });

        const tabName = strings.Strings.MsftSmeServiceViewer.Settings.Recovery.Tab;
        await Utils.waitAsync(
            async (): Promise<boolean> => !!(await Utils.findElementAsync('span.ellipsis', tabName)),
            'Wait for {0} tab to load'.format(tabName));

        const tabButton = await Utils.findElementAsync('span.ellipsis', tabName);
        await Utils.clickAsync(tabButton);

        await Utils.retryAsync(
            async () => {
                let dropdownList = new DropdownList(
                    this,
                    { name: 'dropdown list', selector: 'select[formcontrolname="firstFailureAction"]' });
                await dropdownList.selectTextAsync(actionName);

                if (actionName !== strings.Strings.MsftSmeServiceViewer.Settings.Recovery.NoActionOption) {
                    const resetBox = await Utils.findElementAsync('input[formcontrolname="resetFailCountInterval"]');
                    resetBox.clear();
                    resetBox.sendKeys('1');

                    const restartBox = await Utils.findElementAsync('input[formcontrolname="restartServiceInterval"]');
                    restartBox.clear();
                    restartBox.sendKeys('1');
                }

                await Utils.sleepAsync(3000);
                await saveButton.clickAsync();
            },
            'Try to set the failure action to be ' + actionName);

        await TestManager.currentInstance.shell.switchToTopFrameAsync();
        await TestManager.currentInstance.shell.alertBar.waitForAlertByTextAsync(
            strings.Strings.MsftSmeServiceViewer.Settings.Recovery.SuccessNotification);
        await TestManager.currentInstance.shell.switchToToolIFrameAsync();
        await closeButton.clickAsync();

        this.logActionEnd('setRecoveryAction');
    }
}