/**
 * The data structure for service detail, get the following class
 * ServerManager WMI provider class MSFT_ServerServiceDetail
 *  {
 *  string  Name;
 *  string  DisplayName;
 *  string  Description;
 *  uint32  StartupType;
 *  boolean IsDelayedAutoStart;
 *  boolean IsTriggered;
 *  uint32  SupportedControlCodes;
 *  uint32  Status = 0;
 *  uint64  ExitCode = 0;
 *  string  DependentServices[];
 *  };
 */
export class ServiceData {
    public name: string;
    public displayName: string;
    public status: string;
    public startupType: string;
    public description: string;
    public supportedControlCodes: number;
    public antecedentServices: string[];
}

export enum ServiceStartupType {
    Boot = 0,
    System = 1,
    Auto = 2,
    Demand = 3,
    Disabled = 4,
    DelayedAuto = 5,
    AutomaticTriggered = 6,
    AutomaticTriggeredDelayed = 7,
    DemandTriggered = 8,
    All = 98,
    Unknown = 99
}

/**
 * The value of Win32_Service class State property and
 * ServerManager WMI provider MSFT_ServerServiceDetail class Status property
 */
export enum ServiceStatus {
    'Unknown',
    'Stopped',
    'Start Pending',
    'Stop Pending',
    'Running',
    'Continue Pending',
    'Pause Pending',
    'Paused'
}

export const startupTypes = {
    0: 'Restart',
    1: 'System',
    2: 'Automatic',
    3: 'Manual',
    4: 'Disabled',
    5: 'Automatic (Delayed start)',
    6: 'Automatic (Triggered)',
    7: 'Automatic (Delayed start, Triggered)',
    8: 'Manual (Triggered)',
    98: 'All',
    99: 'Unknown'
};

export enum ServiceSupportedControl {
    AcceptStop = 1,
    AcceptPause = 2
}

export const enum ServiceFlags {
    DescriptionTab = 1,
    DependenciesTab = 2
}

export interface ServiceClassificationData {
    header: string;
    property: string;
    flag: ServiceFlags;
    selected: boolean;
}