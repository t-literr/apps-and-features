let strings = require('../../assets/strings/strings.json');
import { BaseUI, DropdownList, Settings, Shell, TestManager, UIObject, Utils } from '@msft-sme/shell/e2e';
import { WebElement } from 'selenium-webdriver';
import { ServiceViewer } from '../ui/serviceViewer';

let testManager = new TestManager<ServiceViewer>(new ServiceViewer('Tool'));

testManager.testSuite.describe('Service Viewer', () => {
    let testServiceName='AppMgmt';
    testManager.testSuite.beforeEach(async () => {
        await testManager.goToConnectionAndToolAsync(Settings.connection, 'Services');
    });

    testManager.testSuite.it('validate resource strings generated', async() => {
        let text:string = strings.Strings.MsftSmeServiceViewer.toolDisplayName;
        console.log(text);
        expect(text.length > 0).toBeTruthy();
    });

    testManager.testSuite.it('should be able to view the detail of the service', async () => {
        await testManager.tool.dataTable.selectItemByCellTextAsync('Name', testServiceName);
        let result = await testManager.tool.detailPane.getDetailByLabelAsync('Description:');
        expect(result).not.toBeNull;
    });

    testManager.testSuite.it('should be able to start and stop the service', async () => {
        await testManager.tool.dataTable.selectItemByCellTextAsync('Name', testServiceName);
        let status = await testManager.tool.dataTable.getCellTextInSelectedItemAsync('Status');
        if (status !== 'Stopped') {
            await testManager.tool.stopServiceAsync(testServiceName);
        }

        await testManager.tool.startServiceAsync(testServiceName);
        await testManager.tool.stopServiceAsync(testServiceName);
    });

    testManager.testSuite.it('should be able to update the start up settings of the service', async () => {
        let currentStartupMode = await testManager.tool.getServiceStartupModeAsync(testServiceName);
        if (currentStartupMode === 'Automatic' || currentStartupMode === 'Auto') {
            await testManager.tool.setServiceStartupModeAsync(testServiceName, 'Manual');
        }

        await testManager.tool.setServiceStartupModeAsync(testServiceName, 'Automatic');
        await testManager.tool.setServiceStartupModeAsync(testServiceName, 'Manual');
    });

    testManager.testSuite.it('should be able to update the recovery settings of the service', async () => {
        const recoveryStrings = strings.Strings.MsftSmeServiceViewer.Settings.Recovery;
        let currentAction = await testManager.tool.getRecoveryAction(testServiceName);
        if (currentAction !== recoveryStrings.NoActionOption) {
            await testManager.tool.setRecoveryAction(testServiceName, recoveryStrings.NoActionOption);
        }

        await testManager.tool.setRecoveryAction(testServiceName, recoveryStrings.RestartOption);
        await testManager.tool.setRecoveryAction(testServiceName, recoveryStrings.NoActionOption);
    });
}, ['servers']);
