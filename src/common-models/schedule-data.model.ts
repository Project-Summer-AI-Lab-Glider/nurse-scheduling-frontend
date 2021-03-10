/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { validateEmployeeInfo, WorkersInfoModel } from "./worker-info.model";
import { MonthInfoModel, validateMonthInfo } from "./month-info.model";
import { ScheduleMetadata, validateScheduleInfo } from "./schedule.model";
import { ShiftCode, ShiftInfoModel, ShiftModel, validateShiftInfoModel } from "./shift-info.model";
import { RevisionType, ScheduleKey } from "../api/persistance-store.model";
import * as _ from "lodash";
import {
  cropMonthInfoToMonth,
  cropShiftsToMonth,
} from "../state/reducers/month-state/schedule-data/common-reducers";
import { ArrayHelper } from "../helpers/array.helper";
import { MonthHelper, NUMBER_OF_DAYS_IN_WEEK } from "../helpers/month.helper";
import { LocalStorageProvider } from "../api/local-storage-provider.model";

/* eslint-disable @typescript-eslint/camelcase */

export type ScheduleContainer = ScheduleDataModel | MonthDataModel;

export enum ScheduleContainerType {
  "MONTH_DM" = "MONTH_DM",
  "SCHEDULE_DM" = "SCHEDULE_DM",
}

export type ScheduleContainerLength = {
  [key in ScheduleContainerType]: number[];
};

const POSSIBLE_WEEK_COUNT_IN_MONTH = [4, 5, 6];

export const SCHEDULE_CONTAINERS_LENGTH: ScheduleContainerLength = {
  MONTH_DM: [28, 29, 30, 31],
  SCHEDULE_DM: POSSIBLE_WEEK_COUNT_IN_MONTH.map((wc) => wc * NUMBER_OF_DAYS_IN_WEEK),
};

export interface ScheduleDataModel {
  schedule_info: ScheduleMetadata;
  month_info: MonthInfoModel;
  employee_info: WorkersInfoModel;
  shifts: ShiftInfoModel;
  shift_types: ShiftModel;
  isAutoGenerated: boolean;
  isCorrupted: boolean;
}

function isScheduleDM(container: ScheduleContainer): container is ScheduleDataModel {
  return (container as ScheduleDataModel).schedule_info !== undefined;
}

export function validateScheduleContainer(scheduleContainer: ScheduleContainer): void {
  const {
    shifts,
    month_info: monthInfo,
    employee_info: employeeInfo,
    shift_types: shiftTypes,
  } = scheduleContainer;
  if (isScheduleDM(scheduleContainer)) {
    const { schedule_info: scheduleInfo } = scheduleContainer;
    validateScheduleInfo(scheduleInfo);
  }

  const scheduleLength = isScheduleDM(scheduleContainer)
    ? ScheduleContainerType.SCHEDULE_DM
    : ScheduleContainerType.MONTH_DM;

  validateShiftInfoModel(shifts, scheduleLength);
  validateMonthInfo(monthInfo, scheduleLength);
  validateEmployeeInfo(employeeInfo);
  validateScheduleContainerDataIntegrity({
    shifts,
    month_info: monthInfo,
    employee_info: employeeInfo,
    shift_types: shiftTypes,
  });
}

export interface MonthDataModel extends Omit<ScheduleDataModel, "schedule_info" | "revisionType"> {
  scheduleKey: ScheduleKey;
}

export function isMonthModelEmpty(monthDataModel: MonthDataModel): boolean {
  const requiredFields: (keyof Pick<
    MonthDataModel,
    "employee_info" | "month_info" | "shifts"
  >)[] = ["employee_info", "month_info", "shifts"];
  return requiredFields.every((field) => {
    const requiredObject = monthDataModel[field];
    return Object.values(requiredObject).every((field) => _.isEmpty(field));
  });
}

export function createEmptyMonthDataModel(
  scheduleKey: ScheduleKey,
  {
    employee_info,
    shifts,
    shift_types,
  }: Pick<MonthDataModel, "employee_info" | "shifts" | "shift_types">
): MonthDataModel {
  const dates = MonthHelper.daysInMonth(scheduleKey.month, scheduleKey.year);
  const monthLength = dates.length;

  const freeShifts: ShiftInfoModel = {};
  Object.keys(shifts).forEach((key) => {
    freeShifts[key] = new Array(monthLength).fill(ShiftCode.W);
  });
  return {
    scheduleKey,
    month_info: {
      children_number: new Array(monthLength).fill(0),
      extra_workers: new Array(monthLength).fill(0),
      frozen_shifts: [],
      dates,
    },
    employee_info: _.cloneDeep(employee_info),
    shifts: freeShifts,
    isAutoGenerated: true,
    shift_types: _.cloneDeep(shift_types),
    isCorrupted: false,
  };
}

export function getScheduleKey(newSchedule: ScheduleDataModel): ScheduleKey {
  return new ScheduleKey(
    newSchedule.schedule_info.month_number ?? new Date().getMonth(),
    newSchedule.schedule_info.year ?? new Date().getFullYear()
  );
}

export async function extendMonthDMRevisionToScheduleDM(
  currentMonthData: MonthDataModel,
  revision: RevisionType
): Promise<ScheduleDataModel> {
  const [prevMonth, nextMonth] = await new LocalStorageProvider().fetchOrCreateMonthNeighbours(
    currentMonthData,
    revision
  );
  return extendMonthDMToScheduleDM(prevMonth, currentMonthData, nextMonth);
}

export function extendMonthDMToScheduleDM(
  prevMonthData: MonthDataModel,
  currentMonthData: MonthDataModel,
  nextMonthData: MonthDataModel
): ScheduleDataModel {
  const { scheduleKey } = currentMonthData;
  const {
    daysMissingFromPrevMonth,
    daysMissingFromNextMonth,
  } = MonthHelper.calculateMissingFullWeekDays(scheduleKey);
  const extendSchedule = <T>(sectionKey: string, valueKey: string, defaultValue: T): T[] =>
    ArrayHelper.extend<T>(
      prevMonthData[sectionKey][valueKey],
      daysMissingFromPrevMonth,
      currentMonthData[sectionKey][valueKey],
      nextMonthData[sectionKey][valueKey],
      daysMissingFromNextMonth,
      defaultValue
    );

  const shifts: ShiftInfoModel = {};
  Object.keys(currentMonthData.shifts).forEach((key) => {
    shifts[key] = extendSchedule("shifts", key, ShiftCode.W);
  });

  const monthInfoModel: MonthInfoModel = {
    children_number: extendSchedule("month_info", "children_number", 0),
    extra_workers: extendSchedule("month_info", "extra_workers", 0),
    dates: extendSchedule("month_info", "dates", 0),
    frozen_shifts: [],
  };

  return {
    ...currentMonthData,
    schedule_info: {
      UUID: "0",
      month_number: scheduleKey.month,
      year: scheduleKey.year,
    },
    month_info: monthInfoModel,
    shifts,
  };
}

export function cropScheduleDMToMonthDM(schedule: ScheduleDataModel): MonthDataModel {
  const { dates } = schedule.month_info;
  const monthStart = dates.findIndex((v) => v === 1);
  const monthKey = getScheduleKey(schedule);
  const shift = cropShiftsToMonth(monthKey, schedule.shifts, monthStart);
  const month = cropMonthInfoToMonth(monthKey, schedule.month_info, monthStart);
  return {
    ...schedule,
    scheduleKey: monthKey,
    shifts: shift,
    month_info: month,
  };
}

function validateScheduleContainerDataIntegrity({
  month_info: monthInfo,
  employee_info: employeeInfo,
  shifts,
  shift_types: shiftTypes,
}: Pick<ScheduleDataModel, "month_info" | "employee_info" | "shifts" | "shift_types">): void {
  const scheduleLen = monthInfo.dates.length;
  validateShiftLengthIntegrity(scheduleLen, shifts);
  validateWorkersIntegrity(employeeInfo, shifts);
  validateShiftTypesIntegrity(shiftTypes, shifts);
}

function validateShiftLengthIntegrity(scheduleLen: number, shifts: ShiftInfoModel): void {
  if (shifts) {
    const [worker, workerShifts] = Object.entries(shifts)[0];
    const shiftLen = workerShifts.length;
    if (shiftLen !== scheduleLen) {
      throw new Error(
        `Shifts for worker: ${worker} have different length ${shiftLen} than dates ${shiftLen} `
      );
    }
  }
}

function validateWorkersIntegrity(employeeInfo: WorkersInfoModel, shifts: ShiftInfoModel): void {
  const workersWithShifts = _.sortBy(Object.keys(shifts));
  const workersWithType = _.sortBy(Object.keys(employeeInfo.type));
  if (!_.isEqual(workersWithType, workersWithShifts)) {
    throw new Error(
      `Shifts cannot be defined for workers without defined type. Workers without defined shifts are
      ${workersWithType.filter((w) => !workersWithShifts.includes(w)).join(", ")}`
    );
  }
}

function validateShiftTypesIntegrity(shiftModel: ShiftModel, shifts: ShiftInfoModel): void {
  const shiftTypes = Object.keys(shiftModel);
  Object.values(shifts).forEach((workerShifts) => {
    const shiftsNotIncludedInShiftTypes = workerShifts.filter(
      (shift) => !shiftTypes.includes(shift)
    );
    if (shiftsNotIncludedInShiftTypes.length > 0) {
      throw new Error(
        `Worker shifts contain shifts codes ${JSON.stringify(
          shiftsNotIncludedInShiftTypes
        )} which are not included in shift model`
      );
    }
  });
}
