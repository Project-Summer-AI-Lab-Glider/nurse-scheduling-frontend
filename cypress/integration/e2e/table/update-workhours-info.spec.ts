/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { WorkerType } from "../../../../src/common-models/worker-info.model";
import { ShiftCode } from "../../../../src/common-models/shift-info.model";
import { HoursInfo, HoursInfoCells } from "../../../support/commands";

const nurseInitialWorkHours: HoursInfo[] = [
  {
    [HoursInfoCells.required]: 128,
    [HoursInfoCells.actual]: 152,
    [HoursInfoCells.overtime]: 24,
  },
  {
    [HoursInfoCells.required]: 160,
    [HoursInfoCells.actual]: 240,
    [HoursInfoCells.overtime]: 80,
  },
  {
    [HoursInfoCells.required]: 128,
    [HoursInfoCells.actual]: 264,
    [HoursInfoCells.overtime]: 136,
  },
  {
    [HoursInfoCells.required]: 128,
    [HoursInfoCells.actual]: 144,
    [HoursInfoCells.overtime]: 16,
  },
  {
    [HoursInfoCells.required]: 160,
    [HoursInfoCells.actual]: 144,
    [HoursInfoCells.overtime]: -16,
  },
  {
    [HoursInfoCells.required]: 48,
    [HoursInfoCells.actual]: 84,
    [HoursInfoCells.overtime]: 36,
  },
];
const babysitterInitialWorkHours: HoursInfo[] = [
  {
    [HoursInfoCells.required]: 88,
    [HoursInfoCells.actual]: 116,
    [HoursInfoCells.overtime]: 28,
  },
  {
    [HoursInfoCells.required]: 72,
    [HoursInfoCells.actual]: 96,
    [HoursInfoCells.overtime]: 24,
  },
  {
    [HoursInfoCells.required]: 40,
    [HoursInfoCells.actual]: 48,
    [HoursInfoCells.overtime]: 8,
  },
  {
    [HoursInfoCells.required]: 72,
    [HoursInfoCells.actual]: 108,
    [HoursInfoCells.overtime]: 36,
  },
  {
    [HoursInfoCells.required]: 160,
    [HoursInfoCells.actual]: 260,
    [HoursInfoCells.overtime]: 100,
  },
  {
    [HoursInfoCells.required]: 160,
    [HoursInfoCells.actual]: 224,
    [HoursInfoCells.overtime]: 64,
  },
];

interface TestCase {
  workerType: WorkerType;
  workerIdx: number;
  shiftIndex: number;
  initialShiftCode: ShiftCode;
  desiredShiftCode: ShiftCode;
  expectedWorkHoursInfo: HoursInfo;
}

function testWorkHoursInfoUpdate({
  workerType,
  workerIdx,
  shiftIndex,
  initialShiftCode,
  desiredShiftCode,
  expectedWorkHoursInfo,
}: TestCase) {
  const workerData = {
    workerType: workerType,
    workerIdx: workerIdx,
    shiftIdx: shiftIndex,
  };
  cy.checkWorkerShift({ ...workerData, desiredShiftCode: initialShiftCode });
  cy.changeWorkerShift({ ...workerData, newShiftCode: desiredShiftCode });
  cy.checkWorkerShift({ ...workerData, desiredShiftCode });
  cy.checkHoursInfo({ workerType, workerIdx, hoursInfo: expectedWorkHoursInfo });
}

const prevMonthDays = 6;
context("Work hours info (summary table)", () => {
  // sanity check in case schedule in the docs gets changed and these tests start failing because of it
  before("Has expected initial values of workHourInfo in example schedule", () => {
    cy.loadScheduleToMonth();
    cy.enterEditMode();

    nurseInitialWorkHours.forEach((nurseHours, idx) => {
      cy.checkHoursInfo({
        workerType: WorkerType.NURSE,
        workerIdx: idx,
        hoursInfo: nurseHours,
      });
    });

    babysitterInitialWorkHours.forEach((babysitterHours, idx) => {
      cy.checkHoursInfo({
        workerType: WorkerType.OTHER,
        workerIdx: idx,
        hoursInfo: babysitterHours,
      });
    });
  });

  it("Is added, should add 12 to actual and overtime hours and not change required", () => {
    const data = {
      workerType: WorkerType.NURSE,
      workerIdx: 0,
      shiftIndex: prevMonthDays + 9,
      initialShiftCode: ShiftCode.W,
      desiredShiftCode: ShiftCode.D,
      expectedWorkHoursInfo: {
        [HoursInfoCells.required]: nurseInitialWorkHours[0][HoursInfoCells.required],
        [HoursInfoCells.actual]: nurseInitialWorkHours[0][HoursInfoCells.actual] + 12,
        [HoursInfoCells.overtime]: nurseInitialWorkHours[0][HoursInfoCells.overtime] + 12,
      },
    };

    testWorkHoursInfoUpdate(data);
  });

  it("Is removed, should subtract 12 from actual and overtime hours and not change required", () => {
    const data = {
      workerType: WorkerType.NURSE,
      workerIdx: 1,
      shiftIndex: prevMonthDays + 1,
      initialShiftCode: ShiftCode.D,
      desiredShiftCode: ShiftCode.W,
      expectedWorkHoursInfo: {
        [HoursInfoCells.required]: nurseInitialWorkHours[1][HoursInfoCells.required],
        [HoursInfoCells.actual]: nurseInitialWorkHours[1][HoursInfoCells.actual] - 12,
        [HoursInfoCells.overtime]: nurseInitialWorkHours[1][HoursInfoCells.overtime] - 12,
      },
    };
    testWorkHoursInfoUpdate(data);
  });

  it("When U for current month weekday is added, should subtract 8 from required hours, add 8 to overtime and not change actual", () => {
    const data = {
      workerType: WorkerType.NURSE,
      workerIdx: 2,
      shiftIndex: prevMonthDays + 8,
      initialShiftCode: ShiftCode.W,
      desiredShiftCode: ShiftCode.U,
      expectedWorkHoursInfo: {
        [HoursInfoCells.required]: nurseInitialWorkHours[2][HoursInfoCells.required] - 8,
        [HoursInfoCells.actual]: nurseInitialWorkHours[2][HoursInfoCells.actual],
        [HoursInfoCells.overtime]: nurseInitialWorkHours[2][HoursInfoCells.overtime] + 8,
      },
    };
    testWorkHoursInfoUpdate(data);
  });
  it("When U for current month weekday is removed, should add 8 to required hours, subtract 8 from overtime and not change actual", () => {
    const data = {
      workerType: WorkerType.NURSE,
      workerIdx: 3,
      shiftIndex: prevMonthDays + 25,
      initialShiftCode: ShiftCode.U,
      desiredShiftCode: ShiftCode.W,
      expectedWorkHoursInfo: {
        [HoursInfoCells.required]: nurseInitialWorkHours[3][HoursInfoCells.required] + 8,
        [HoursInfoCells.actual]: nurseInitialWorkHours[3][HoursInfoCells.actual],
        [HoursInfoCells.overtime]: nurseInitialWorkHours[3][HoursInfoCells.overtime] - 8,
      },
    };
    testWorkHoursInfoUpdate(data);
  });

  it("When changing previous month shift from W to DN, shouldn't change work hours info at all", () => {
    const data = {
      workerType: WorkerType.NURSE,
      workerIdx: 4,
      shiftIndex: prevMonthDays - 2,
      initialShiftCode: ShiftCode.W,
      desiredShiftCode: ShiftCode.U,
      expectedWorkHoursInfo: {
        [HoursInfoCells.required]: nurseInitialWorkHours[4][HoursInfoCells.required],
        [HoursInfoCells.actual]: nurseInitialWorkHours[4][HoursInfoCells.actual],
        [HoursInfoCells.overtime]: nurseInitialWorkHours[4][HoursInfoCells.overtime],
      },
    };
    testWorkHoursInfoUpdate(data);
  });

  it("When L4 for current month weekday is added, should subtract 8 from required hours, add 8 to overtime and not change actual", () => {
    const data = {
      workerType: WorkerType.NURSE,
      workerIdx: 5,
      shiftIndex: prevMonthDays + 22,
      initialShiftCode: ShiftCode.W,
      desiredShiftCode: ShiftCode.L4,
      expectedWorkHoursInfo: {
        [HoursInfoCells.required]: nurseInitialWorkHours[5][HoursInfoCells.required] - 8,
        [HoursInfoCells.actual]: nurseInitialWorkHours[5][HoursInfoCells.actual],
        [HoursInfoCells.overtime]: nurseInitialWorkHours[5][HoursInfoCells.overtime] + 8,
      },
    };
    testWorkHoursInfoUpdate(data);
  });

  it("When N for current month weekday is added, should add 12 to actual and overtime hours and not change required", () => {
    const data = {
      workerType: WorkerType.OTHER,
      workerIdx: 0,
      shiftIndex: prevMonthDays + 3,
      initialShiftCode: ShiftCode.W,
      desiredShiftCode: ShiftCode.N,
      expectedWorkHoursInfo: {
        [HoursInfoCells.required]: babysitterInitialWorkHours[0][HoursInfoCells.required],
        [HoursInfoCells.actual]: babysitterInitialWorkHours[0][HoursInfoCells.actual] + 12,
        [HoursInfoCells.overtime]: babysitterInitialWorkHours[0][HoursInfoCells.overtime] + 12,
      },
    };
    testWorkHoursInfoUpdate(data);
  });
  it("Is removed, should subtract 12 from actual and overtime hours and not change required", () => {
    const data = {
      workerType: WorkerType.OTHER,
      workerIdx: 1,
      shiftIndex: prevMonthDays + 6,
      initialShiftCode: ShiftCode.N,
      desiredShiftCode: ShiftCode.W,
      expectedWorkHoursInfo: {
        [HoursInfoCells.required]: babysitterInitialWorkHours[1][HoursInfoCells.required],
        [HoursInfoCells.actual]: babysitterInitialWorkHours[1][HoursInfoCells.actual] - 12,
        [HoursInfoCells.overtime]: babysitterInitialWorkHours[1][HoursInfoCells.overtime] - 12,
      },
    };
    testWorkHoursInfoUpdate(data);
  });

  it("When U for current month weekday is added, should subtract 8 from required hours, add 8 to overtime and not change actual", () => {
    const data = {
      workerType: WorkerType.OTHER,
      workerIdx: 2,
      shiftIndex: prevMonthDays + 3,
      initialShiftCode: ShiftCode.W,
      desiredShiftCode: ShiftCode.U,
      expectedWorkHoursInfo: {
        [HoursInfoCells.required]: babysitterInitialWorkHours[2][HoursInfoCells.required] - 8,
        [HoursInfoCells.actual]: babysitterInitialWorkHours[2][HoursInfoCells.actual],
        [HoursInfoCells.overtime]: babysitterInitialWorkHours[2][HoursInfoCells.overtime] + 8,
      },
    };
    testWorkHoursInfoUpdate(data);
  });
  it("When U for current month weekday is removed, should add 8 to required hours, subtract 8 from overtime and not change actual", () => {
    const data = {
      workerType: WorkerType.OTHER,
      workerIdx: 3,
      shiftIndex: prevMonthDays + 4,
      initialShiftCode: ShiftCode.U,
      desiredShiftCode: ShiftCode.W,
      expectedWorkHoursInfo: {
        [HoursInfoCells.required]: babysitterInitialWorkHours[3][HoursInfoCells.required] + 8,
        [HoursInfoCells.actual]: babysitterInitialWorkHours[3][HoursInfoCells.actual],
        [HoursInfoCells.overtime]: babysitterInitialWorkHours[3][HoursInfoCells.overtime] - 8,
      },
    };
    testWorkHoursInfoUpdate(data);
  });

  it("When changing previous month shift from W to N, shouldn't change work hours info at all", () => {
    const data = {
      workerType: WorkerType.OTHER,
      workerIdx: 4,
      shiftIndex: prevMonthDays - 1,
      initialShiftCode: ShiftCode.W,
      desiredShiftCode: ShiftCode.N,
      expectedWorkHoursInfo: {
        [HoursInfoCells.required]: babysitterInitialWorkHours[4][HoursInfoCells.required],
        [HoursInfoCells.actual]: babysitterInitialWorkHours[4][HoursInfoCells.actual],
        [HoursInfoCells.overtime]: babysitterInitialWorkHours[4][HoursInfoCells.overtime],
      },
    };
    testWorkHoursInfoUpdate(data);
  });

  it("When L4 for current month weekday is added, should subtract 8 from required hours, add 8 to overtime and not change actual", () => {
    const data = {
      workerType: WorkerType.OTHER,
      workerIdx: 5,
      shiftIndex: prevMonthDays + 1,
      initialShiftCode: ShiftCode.W,
      desiredShiftCode: ShiftCode.L4,
      expectedWorkHoursInfo: {
        [HoursInfoCells.required]: babysitterInitialWorkHours[5][HoursInfoCells.required] - 8,
        [HoursInfoCells.actual]: babysitterInitialWorkHours[5][HoursInfoCells.actual],
        [HoursInfoCells.overtime]: babysitterInitialWorkHours[5][HoursInfoCells.overtime] + 8,
      },
    };
    testWorkHoursInfoUpdate(data);
  });
});
