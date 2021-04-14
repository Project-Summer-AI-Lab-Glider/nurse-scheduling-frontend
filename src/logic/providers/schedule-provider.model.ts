/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import * as _ from "lodash";
import { ScheduleDataModel } from "../../common-models/schedule-data.model";
import { SHIFTS } from "../../common-models/shift-info.model";
import { WorkerType } from "../../common-models/worker-info.model";
import { FoundationInfoProvider } from "./foundation-info-provider.model";
import { MetadataProvider } from "./metadata-provider.model";
import { ShiftsProvider } from "./shifts-provider.model";

export interface Sections {
  Metadata: MetadataProvider;
  WorkerGroups: ShiftsProvider[];
  FoundationInfo: FoundationInfoProvider;
}
export interface ScheduleProvider {
  readonly sections: Sections;
  readonly isAutoGenerated: boolean;
  getWorkerTypes(): { [workerName: string]: WorkerType };
}

export class Schedule {
  private provider: ScheduleProvider;

  constructor(provider: ScheduleProvider) {
    this.provider = provider;
  }

  /* eslint-disable @typescript-eslint/camelcase */
  public getDataModel(): ScheduleDataModel {
    const sections = this.provider.sections;
    return {
      schedule_info: {
        month_number: sections.Metadata !== undefined ? sections.Metadata.monthNumber : 0,
        year: sections.Metadata !== undefined ? sections.Metadata?.year : 0,
      },
      shifts: sections.WorkerGroups.map((section) => section.workerShifts).reduce(
        (acc, section) => ({
          ...acc,
          ...section,
        })
      ),
      month_info: {
        frozen_shifts: sections.Metadata !== undefined ? sections.Metadata.frozenDates : [],
        children_number:
          sections.FoundationInfo !== undefined ? sections.FoundationInfo.childrenInfo : [],
        dates: sections.Metadata !== undefined ? sections.Metadata.dates : [],
        extra_workers:
          sections.FoundationInfo !== undefined ? sections.FoundationInfo.extraWorkersInfo : [],
      },
      employee_info: {
        type: this.provider.getWorkerTypes(),
        time: sections.WorkerGroups.map(
          (section) => section.availableWorkersWorkTime
        ).reduce((acc, section) => ({ ...acc, ...section })),
        team: sections.WorkerGroups.map(
          (section) => section.availableWorkersGroup
        ).reduce((acc, section) => ({ ...acc, ...section })),
      },
      isAutoGenerated: this.provider.isAutoGenerated,
      shift_types: _.cloneDeep(SHIFTS),
      isCorrupted: false,
    };
  }
  /* eslint-enable @typescript-eslint/camelcase */
}
