require('./load-jsdom.helper');
require('./load-babel-require.helper');

require('rxjs');

require('@msft-sme/shell/dist/core/polyfills');

global['MsftSme'] = (<any>window).MsftSme;