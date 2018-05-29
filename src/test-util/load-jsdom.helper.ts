// Loads JSDOM and configures it so UTs can access all the features as winthin a browser
/* tslint:disable */
let jsdom = require('jsdom');
let strings = require('../assets/strings/strings.json');
(<any>global).document = jsdom.jsdom('<body></body>');
(<any>global).window = document.defaultView;
(<any>global).navigator = window.navigator;

// load jQuery that is needed by signalR
(<any>global).window.jQuery = require('jquery/dist/jquery.js');
(<any>global).$ = (<any>global).window.jQuery;
(<any>global).window.Event = {};

(<any>global).MsftSme = { 
    resourcesStrings: () => {return strings.Strings;},
    last: (items:any[])=> items[items.length-1]
};

Object.keys(document.defaultView).forEach(property => {
  if (typeof global[property] === 'undefined') {
    global[property] = document.defaultView[property];
  }
});

class MockStorage implements Storage {
    public length: number;

    private items = {};

    [index: number]: string;

    public clear(): void {
        this.items = {};
    }

    public getItem(key: string): string {
        return <string>this.items[key];
    }

    public key(index: number): string {
        return this[index];
    }

    public removeItem(key: string): void {
        this.items[key] = undefined;
    }

    public setItem(key: string, data: string): void {
        this.items[key] = data;
    }
}

(<any>global).localStorage = new MockStorage();
(<any>global).sessionStorage = new MockStorage();
