/// <reference path="../../../support/index.d.ts" />

import { WorkerType } from "../../../../src/common-models/worker-info.model";
import { GetWorkerShiftOptions } from "../../../support/commands";
import { ShiftCode } from "../../../../src/common-models/shift-info.model";

interface TestCase {
  testedShiftCell: GetWorkerShiftOptions;
  firstShift: ShiftCode;
  secondShift: ShiftCode;
}

const testCases: TestCase[] = [
  {
    testedShiftCell: {
      workerType: WorkerType.NURSE,
      workerIdx: 0,
      shiftIdx: 0,
    },
    firstShift: ShiftCode.R,
    secondShift: ShiftCode.P,
  },
  {
    testedShiftCell: {
      workerType: WorkerType.OTHER,
      workerIdx: 3,
      shiftIdx: 5,
    },
    firstShift: ShiftCode.N,
    secondShift: ShiftCode.DN,
  },
];

context("Undo/Redo test", () => {
  before(() => {
    cy.loadSchedule();
    cy.get("[data-cy=edit-mode-button]").click();
    cy.get("[data-cy=nurseShiftsTable]", { timeout: 10000 });
  });

  testCases.forEach((testCase) => {
    it(`Should change worker (type: ${testCase.testedShiftCell.workerType.toLowerCase()}) shift and
       use undo and redo buttons to set proper cell state`, () => {
      cy.changeWorkerShift({ ...testCase.testedShiftCell, newShiftCode: testCase.firstShift });
      cy.changeWorkerShift({ ...testCase.testedShiftCell, newShiftCode: testCase.secondShift });

      cy.get("[data-cy=undo-button]").click();
      cy.getWorkerShift(testCase.testedShiftCell).contains(testCase.firstShift);

      cy.get("[data-cy=redo-button]").click();
      cy.getWorkerShift(testCase.testedShiftCell).contains(testCase.secondShift);
    });
  });

  testCases.forEach((testCase) => {
    it(`Should change worker (type: ${testCase.testedShiftCell.workerType.toLowerCase()}shift and
       use undo and redo shortcuts to set proper cell state`, () => {
      cy.changeWorkerShift({ ...testCase.testedShiftCell, newShiftCode: testCase.firstShift });
      cy.changeWorkerShift({ ...testCase.testedShiftCell, newShiftCode: testCase.secondShift });

      cy.get("body").type("{ctrl}{z}");
      cy.getWorkerShift(testCase.testedShiftCell).contains(testCase.firstShift);

      cy.get("body").type("{ctrl}{shift}{z}");
      cy.getWorkerShift(testCase.testedShiftCell).contains(testCase.secondShift);
    });
  });
});