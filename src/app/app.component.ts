import { Component, OnDestroy, OnInit } from '@angular/core';
import { AppContextService, DialogService, NavigationService } from '@msft-sme/shell/angular';

@Component({
    selector: 'sme-root',
    templateUrl: './app.component.html'
})
export class AppComponent implements OnDestroy, OnInit {
    constructor(
        private appContext: AppContextService,  private navigationService: NavigationService, private dialogService: DialogService) {
    }

    public ngOnInit(): void {
        this.appContext.ngInit({ dialogService: this.dialogService, navigationService: this.navigationService });
    }

    public ngOnDestroy() {
        this.appContext.ngDestroy();
    }
}
