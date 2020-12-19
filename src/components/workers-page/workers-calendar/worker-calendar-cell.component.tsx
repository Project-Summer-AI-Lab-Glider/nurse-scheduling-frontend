import React from "react";
import { VerboseDate } from "../../../common-models/month-info.model";
import { ShiftCode } from "../../../common-models/shift-info.model";

interface CellOptions {
  keepOn: boolean;
  date: VerboseDate;
  shift: ShiftCode;
  hasNext: boolean;
  notCurrentMonth: boolean;
}

export function WorkersCalendarCell(params: CellOptions): JSX.Element {
  const date = params.date;
  const shift = params.shift;
  const keepOn = "keepOn" + params.keepOn;
  const hasNext = "hasNext" + params.hasNext;
  const notCurrentMonth = "notCurrentMonth" + params.notCurrentMonth;

  return (
    <>
      <div className={"workersCalendarCell"}>
        <div className={"TopCellPart " + notCurrentMonth}>{date!["date"]}</div>
        <div className={"BottomCellPart " + keepOn + shift + " " + hasNext}>
          <div className={"leftBorder leftBorderColor"} />
          <p>{params.keepOn ? void 0 : shift}</p>
        </div>
      </div>
    </>
  );
}