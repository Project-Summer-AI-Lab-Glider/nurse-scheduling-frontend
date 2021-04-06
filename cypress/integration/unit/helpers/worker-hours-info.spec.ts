/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import * as _ from "lodash";
import { MonthDataArray, ShiftHelper } from "../../../../src/helpers/shifts.helper";
import { WorkerHourInfo } from "../../../../src/helpers/worker-hours-info.model";
import {
  SHIFTS,
  WORKING_SHIFTS,
  FREE_SHIFTS,
  ShiftCode,
  Shift,
} from "../../../../src/state/schedule-data/shifts-types/shift-types.model";
import { ContractType } from "../../../../src/state/schedule-data/worker-info/worker-info.model";
import { workerTestData, WorkerTestDataInstance } from "../../../fixtures/march-2021-worker-data";

describe("Worker hours info", () => {
  workerTestData.forEach((workerInstance) => {
    it(`Should calculate same worker norm as norm in example schedule when no base schedule exists for worker ${workerInstance.workerName}`, () => {
      const workerHours = calculateWorkerHoursFromWorkerInstance(workerInstance);
      expect(workerHours.workerHourNorm).to.equal(workerInstance.workerReqiuredHours);
      expect(workerHours.workerTime).to.equal(workerInstance.workerActualHours);
    });
  });

  const exampleWorker = workerTestData[0];

  const exampleWorkringShift = SHIFTS[WORKING_SHIFTS[0]];
  const exampleFreeShift = SHIFTS[FREE_SHIFTS[0]];
  it(`Should subtract from worker required hours duration of ${exampleWorkringShift.code} when it 
            is replaced with ${exampleFreeShift.code}`, () => {
    const testedShiftDuration = ShiftHelper.shiftCodeToWorkTime(exampleWorkringShift);
    const {
      primaryScheduleWorkerHoursInfoRequiredTime,
      actualScheduleWorkerHoursInfoRequiredTime,
    } = calculateRequiredTimeForPrimaryScheduleWithShiftAndForActualScheduleAfterShiftReplacement(
      exampleWorker,
      exampleWorkringShift,
      exampleFreeShift
    );
    const expectedWorkHourNorm =
      primaryScheduleWorkerHoursInfoRequiredTime.workerHourNorm - testedShiftDuration;
    expect(actualScheduleWorkerHoursInfoRequiredTime.workerHourNorm).to.equal(expectedWorkHourNorm);
  });

  it("Worker norm should not be recalculated if working shift was replaced with W", () => {
    const exampleShift = SHIFTS[ShiftCode.D];
    const freeShift = SHIFTS[ShiftCode.W];
    const {
      primaryScheduleWorkerHoursInfoRequiredTime,
      actualScheduleWorkerHoursInfoRequiredTime,
    } = calculateRequiredTimeForPrimaryScheduleWithShiftAndForActualScheduleAfterShiftReplacement(
      exampleWorker,
      exampleShift,
      freeShift
    );
    const expectedWorkHourNorm = primaryScheduleWorkerHoursInfoRequiredTime.workerHourNorm;
    expect(actualScheduleWorkerHoursInfoRequiredTime.workerHourNorm).to.equal(expectedWorkHourNorm);
    expect(actualScheduleWorkerHoursInfoRequiredTime.workerHourNorm).to.equal(expectedWorkHourNorm);
  });

  it("Should not throw when test data contains more days than one month could normally contain", () => {
    const testedMonthParams = {
      monthNumber: 2,
      dayCount: 31,
      year: 2021,
    };
    const dates = _.range(1, testedMonthParams.dayCount + 5);
    const shifts = dates.map((_) => ShiftCode.W);
    const primaryShifts = shifts;
    const calculateWorkerDataAction = (): WorkerHourInfo =>
      WorkerHourInfo.fromWorkerInfo(
        shifts,
        primaryShifts as MonthDataArray<ShiftCode>,
        1,
        ContractType.EMPLOYMENT_CONTRACT,
        testedMonthParams.monthNumber,
        testedMonthParams.year,
        dates,
        SHIFTS
      );

    expect(calculateWorkerDataAction).to.not.throw();
  });
});

//#region helper function
interface RequiredTimeForPrimaryAndActualSchedule {
  primaryScheduleWorkerHoursInfoRequiredTime: WorkerHourInfo;
  actualScheduleWorkerHoursInfoRequiredTime: WorkerHourInfo;
}

function calculateWorkerHoursFromWorkerInstance(
  workerInstance: WorkerTestDataInstance,
  baseWorkerShifts?: ShiftCode[],
  actualWorkerShifts?: ShiftCode[]
): WorkerHourInfo {
  return WorkerHourInfo.fromWorkerInfo(
    actualWorkerShifts ?? workerInstance.actualWorkerShifts,
    baseWorkerShifts as MonthDataArray<ShiftCode>,
    workerInstance.workerNorm,
    workerInstance.workerContract,
    workerInstance.month,
    workerInstance.year,
    workerInstance.dates,
    SHIFTS
  );
}
function calculateRequiredTimeForPrimaryScheduleWithShiftAndForActualScheduleAfterShiftReplacement(
  workerInstance: WorkerTestDataInstance,
  primaryShift: Shift,
  primaryShiftReplacement: Shift
): RequiredTimeForPrimaryAndActualSchedule {
  const testedShiftIndex = 0;
  const baseWorkerShifts = [...workerInstance.baseWorkerShifts];
  baseWorkerShifts[testedShiftIndex] = primaryShift.code as ShiftCode;
  const actualWorkerShifts = [...baseWorkerShifts];
  const primaryScheduleWorkerHoursInfoRequiredTime = calculateWorkerHoursFromWorkerInstance(
    workerInstance,
    baseWorkerShifts,
    actualWorkerShifts
  );
  // Act
  actualWorkerShifts[testedShiftIndex] = primaryShiftReplacement.code as ShiftCode;
  const actualScheduleWorkerHoursInfoRequiredTime = calculateWorkerHoursFromWorkerInstance(
    workerInstance,
    baseWorkerShifts,
    actualWorkerShifts
  );
  return {
    primaryScheduleWorkerHoursInfoRequiredTime,
    actualScheduleWorkerHoursInfoRequiredTime,
  };
}

//#endregion
