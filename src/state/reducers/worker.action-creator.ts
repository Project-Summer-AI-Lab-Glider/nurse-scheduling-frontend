/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* eslint-disable @typescript-eslint/camelcase */

import * as _ from "lodash";
import { LocalStorageProvider } from "../../api/local-storage-provider.model";
import { RevisionType, ScheduleKey, ThunkFunction } from "../../api/persistance-store.model";
import { MonthDataModel, ScheduleDataModel } from "../../common-models/schedule-data.model";
import { ShiftCode, ShiftInfoModel } from "../../common-models/shift-info.model";
import { WorkerInfoModel, WorkersInfoModel } from "../../common-models/worker-info.model";
import { WorkerInfoExtendedInterface } from "../../components/namestable/worker-edit";
import { MonthHelper } from "../../helpers/month.helper";
import { VerboseDateHelper } from "../../helpers/verbose-date.helper";
import { cropScheduleDMToMonthDM } from "../../logic/schedule-container-convertion/schedule-container-convertion";
import {
  DEFAULT_CONTRACT_TYPE,
  DEFAULT_WORKER_GROUP,
  DEFAULT_WORKER_TYPE,
} from "../../logic/schedule-parser/workers-info.parser";
import { ScheduleDataActionCreator } from "./month-state/schedule-data/schedule-data.action-creator";

export interface WorkerActionPayload {
  updatedShifts: ShiftInfoModel;
  updatedEmployeeInfo: WorkersInfoModel;
}

export class WorkerActionCreator {
  static replaceWorkerShiftsInTmpSchedule(newWorkerShifts: ShiftInfoModel): ThunkFunction<unknown> {
    newWorkerShifts = _.cloneDeep(newWorkerShifts);
    return async (dispatch, getState): Promise<void> => {
      const temporarySchedule = _.cloneDeep(getState().actualState.temporarySchedule.present);
      temporarySchedule.shifts = { ...temporarySchedule.shifts, ...newWorkerShifts };
      const action = ScheduleDataActionCreator.updateSchedule(temporarySchedule);
      dispatch(action);
    };
  }

  static addNewWorker(worker: WorkerInfoExtendedInterface): ThunkFunction<WorkerActionPayload> {
    return async (dispatch, getState): Promise<void> => {
      const actualSchedule = getState().actualState.persistentSchedule.present;
      const actualMonth = cropScheduleDMToMonthDM(actualSchedule);
      const newWorkerShifts = this.createNewWorkerShifts(actualMonth.scheduleKey);

      const updatedMonth = WorkerActionCreator.addWorkerInfoToMonthDM(
        actualMonth,
        worker,
        newWorkerShifts
      );

      dispatch(this.createUpdateAction(updatedMonth));

      const nextMonthDM = await new LocalStorageProvider().getMonthRevision(
        actualMonth.scheduleKey.nextMonthKey.getRevisionKey("primary")
      );
      if (_.isNil(nextMonthDM) || !nextMonthDM.isAutoGenerated) return;
      const nextMonthNewWorkerShifts = this.createNewWorkerShifts(nextMonthDM.scheduleKey);
      const updatedNextMonth = WorkerActionCreator.addWorkerInfoToMonthDM(
        nextMonthDM,
        worker,
        nextMonthNewWorkerShifts
      );
      await new LocalStorageProvider().saveBothMonthRevisionsIfNeeded("primary", updatedNextMonth);
    };
  }

  static deleteWorker(worker: WorkerInfoModel | undefined): ThunkFunction<unknown> {
    return async (dispatch, getState): Promise<void> => {
      if (!worker) return;

      const { name } = worker;
      const actualSchedule = _.cloneDeep(getState().actualState.persistentSchedule.present);
      const actualMonth = cropScheduleDMToMonthDM(actualSchedule);

      const updatedMonth = WorkerActionCreator.deleteWorkerFromMonthDM(actualMonth, name);

      dispatch(this.createUpdateAction(updatedMonth));

      const nextMonthDM = await new LocalStorageProvider().getMonthRevision(
        actualMonth.scheduleKey.nextMonthKey.getRevisionKey("primary")
      );

      if (_.isNil(nextMonthDM) || !nextMonthDM.isAutoGenerated) return;
      const updatedNextMonth = WorkerActionCreator.deleteWorkerFromMonthDM(actualMonth, name);
      await new LocalStorageProvider().saveBothMonthRevisionsIfNeeded("primary", updatedNextMonth);
    };
  }

  static modifyWorker(worker: WorkerInfoExtendedInterface): ThunkFunction<WorkerActionPayload> {
    return async (dispatch, getState): Promise<void> => {
      const { prevName } = worker;
      const actualSchedule = _.cloneDeep(getState().actualState.persistentSchedule.present);
      const actualMonth = cropScheduleDMToMonthDM(actualSchedule);

      let updatedMonth = WorkerActionCreator.addWorkerInfoToMonthDM(
        actualMonth,
        worker,
        actualMonth.shifts[prevName]
      );

      if (prevName !== worker.workerName) {
        updatedMonth = WorkerActionCreator.deleteWorkerFromMonthDM(updatedMonth, prevName);
      }
      dispatch(this.createUpdateAction(updatedMonth));

      const nextMonthDM = await new LocalStorageProvider().getMonthRevision(
        actualMonth.scheduleKey.nextMonthKey.getRevisionKey("primary")
      );
      if (_.isNil(nextMonthDM) || !nextMonthDM.isAutoGenerated) return;
      if (_.isNil(nextMonthDM.shifts[prevName])) {
        throw Error(
          `Next month (${nextMonthDM.scheduleKey}) auto generated instance should have the same ` +
            `workers as current month, but it not include ${prevName}`
        );
      }
      let updatedNextMonth = WorkerActionCreator.addWorkerInfoToMonthDM(
        nextMonthDM,
        worker,
        nextMonthDM.shifts[prevName]
      );
      if (prevName !== worker.workerName) {
        updatedNextMonth = WorkerActionCreator.deleteWorkerFromMonthDM(updatedNextMonth, prevName);
      }
      await new LocalStorageProvider().saveBothMonthRevisionsIfNeeded("primary", updatedNextMonth);
    };
  }

  private static createUpdateAction(
    updatedMonth: MonthDataModel
  ): ThunkFunction<ScheduleDataModel> {
    const { year, month } = updatedMonth.scheduleKey;
    const revision: RevisionType = VerboseDateHelper.isMonthInFuture(month, year)
      ? "primary"
      : "actual";

    return ScheduleDataActionCreator.setScheduleFromMonthDMAndSaveInDB(updatedMonth, revision);
  }

  private static deleteWorkerFromMonthDM(
    monthDataModel: MonthDataModel,
    workerName: string
  ): MonthDataModel {
    const monthDataModelCopy = _.cloneDeep(monthDataModel);
    delete monthDataModelCopy.employee_info.time[workerName];
    delete monthDataModelCopy.employee_info.type[workerName];
    delete monthDataModelCopy.employee_info.contractType?.[workerName];
    delete monthDataModelCopy.shifts[workerName];

    return monthDataModelCopy;
  }

  private static addWorkerInfoToMonthDM(
    monthDataModel: MonthDataModel,
    worker: WorkerInfoExtendedInterface,
    newWorkerShifts: ShiftCode[]
  ): MonthDataModel {
    const updatedSchedule = _.cloneDeep(monthDataModel);
    const { workerName, workerType, contractType, workerGroup } = worker;

    updatedSchedule.shifts = {
      ...updatedSchedule.shifts,
      [workerName]: newWorkerShifts,
    };
    updatedSchedule.employee_info = {
      time: {
        ...updatedSchedule.employee_info.time,
        [workerName]: worker.time,
      },
      type: {
        ...updatedSchedule.employee_info.type,
        [workerName]: workerType ?? DEFAULT_WORKER_TYPE,
      },
      contractType: {
        ...updatedSchedule.employee_info.contractType,
        [workerName]: contractType ?? DEFAULT_CONTRACT_TYPE,
      },
      workerGroup: {
        ...updatedSchedule.employee_info.workerGroup,
        [workerName]: workerGroup ?? DEFAULT_WORKER_GROUP,
      },
    };

    return updatedSchedule;
  }

  private static createNewWorkerShifts({ year, month }: ScheduleKey): ShiftCode[] {
    const today = new Date();
    const newWorkerShifts = new Array(MonthHelper.getMonthLength(year, month)).fill(ShiftCode.W);
    if (today.getMonth() === month && today.getFullYear() === year) {
      newWorkerShifts.splice(
        0,
        today.getDate() - 1,
        ...new Array(today.getDate() - 1).fill(ShiftCode.NZ)
      );
    }
    return newWorkerShifts;
  }
}
