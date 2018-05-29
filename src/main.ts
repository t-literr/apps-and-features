import './polyfills.ts';

import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { CoreEnvironment } from '@msft-sme/shell/core';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { PowerShellScripts } from './generated/powershell-scripts';

if (environment.production) {
    enableProdMode();
}
// initialize SME module environment with localization settings.
CoreEnvironment.initialize(
    {
        name: 'msft.sme.service-viewer',
        powerShellModuleName: PowerShellScripts.module,
        isProduction: environment.production,
        shellOrigin: '*'
    },
    {})
    .then(() => platformBrowserDynamic().bootstrapModule(AppModule));