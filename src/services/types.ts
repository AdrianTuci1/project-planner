export interface InitialDataResponse {
    groups: any[];
    dumpTasks: any[];
    availableLabels: any[];
}

export interface IApiService {
    getInitialData(startDate: Date, endDate: Date): Promise<InitialDataResponse>;
}
