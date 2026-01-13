import { makeAutoObservable } from "mobx";

export class DueDatesSettingsModel {
    thresholdDays: number = 7;

    constructor() {
        makeAutoObservable(this);
    }

    setThreshold(days: number) {
        this.thresholdDays = days;
    }
}
