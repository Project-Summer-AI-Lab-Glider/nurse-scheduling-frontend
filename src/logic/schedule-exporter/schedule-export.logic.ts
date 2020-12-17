import { ScheduleDataModel } from "../../common-models/schedule-data.model";
import xlsx from "exceljs";
import { ShiftCode } from "../../common-models/shift-info.model";
import { MonthInfoLogic } from "../../logic/schedule-logic/month-info.logic";
import { WorkerType } from "../../common-models/worker-info.model";
import {
  ChildrenSectionKey,
  MetaDataRowLabel,
  MetaDataSectionKey,
} from "../../logic/section.model";
import { ShiftHelper } from "../../helpers/shifts.helper";
import { ColorHelper } from "../../helpers/colors/color.helper";
import { Color } from "../../helpers/colors/color.model";
import { TranslationHelper } from "../../helpers/tranlsations.helper";
import { VerboseDate } from "../../common-models/month-info.model";
import { ShiftsInfoLogic } from "../schedule-logic/shifts-info.logic";
import { MetadataLogic } from "../schedule-logic/metadata.logic";

const EMPTY_ROW = Array(100).fill("");

export class ScheduleExportLogic {
  constructor(private scheduleModel: ScheduleDataModel) {}
  static readonly WORKSHEET_NAME = "grafik";
  public formatAndSave(filename: string): void {
    const [workbook, workSheet] = this.createWorkArea();
    const headerRow = this.createHeader(this.scheduleModel);
    const datesSection = this.createDatesSection(this.scheduleModel);
    const childrenInfoSection = this.createChildrenInfoSection(this.scheduleModel);
    const overtimeInfoHeader = this.createWorkHoursInfoHeader(childrenInfoSection[0].length);
    const [nurseShifts, babysitterShifts] = this.createShiftsSections(this.scheduleModel);
    const schedule = [
      headerRow,
      ...datesSection,
      EMPTY_ROW,
      ...childrenInfoSection,
      overtimeInfoHeader,
      ...nurseShifts,
      EMPTY_ROW,
      ...babysitterShifts,
      EMPTY_ROW,
      EMPTY_ROW,
      EMPTY_ROW,
      EMPTY_ROW,
      EMPTY_ROW,
    ];
    this.addStyles(workSheet, schedule);
    this.saveToFile(workbook, filename);
  }

  private createWorkArea(): [xlsx.Workbook, xlsx.Worksheet] {
    const workbook = new xlsx.Workbook();
    return [
      workbook,
      workbook.addWorksheet(ScheduleExportLogic.WORKSHEET_NAME, {
        properties: { defaultColWidth: 5 },
      }),
    ];
  }

  private addStyles(workSheet: xlsx.Worksheet, rows: unknown[]): void {
    const monthInfo = this.scheduleModel.schedule_info;
    const monthLogic = new MonthInfoLogic(
      monthInfo?.month_number || 0,
      monthInfo?.year + "" || "",
      this.scheduleModel.month_info?.dates || [],
      true
    );
    const verboseDates = monthLogic.verboseDates;
    workSheet.addRows(rows);
    workSheet.getColumn(1).width = 20;
    workSheet.eachRow((row) => {
      let isShiftRow = false;
      row.eachCell((cell, colNumber) => {
        const cellValue = cell.value?.toString() || "";
        if ((cellValue && ShiftCode[cellValue]) || isShiftRow) {
          isShiftRow = true;
          // colNumber - 1, because first column is key column
          cell.style = this.getShiftStyle(
            ShiftCode[cellValue] || ShiftCode.W,
            verboseDates[colNumber - 1]
          );
        }
      });
    });
  }

  private getShiftStyle(code: ShiftCode, verboseDate?: VerboseDate): Partial<xlsx.Style> {
    const shiftFillColor = ShiftHelper.getShiftColor(code, verboseDate).backgroundColor;
    const borderColor: Partial<xlsx.Border> = {
      color: { argb: this.rgbaToArgbHex(ColorHelper.getBorderColor()) },
      style: "thin",
    };
    return {
      alignment: {
        horizontal: "center",
        vertical: "middle",
      },
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: this.rgbaToArgbHex(shiftFillColor) },
      },
      border: {
        top: borderColor,
        bottom: borderColor,
        left: borderColor,
        right: borderColor,
      },
    };
  }

  private rgbaToArgbHex(color: Color): string {
    const toHex = (num: number): string => ("0" + num.toString(16)).slice(-2);
    const c = color;
    return `${toHex(c.a)}${toHex(c.r)}${toHex(c.g)}${toHex(c.b)}`;
  }

  private createShiftsSections(scheduleModel: ScheduleDataModel): string[][][] {
    const shiftInfoLogics = this.shiftInfoLogics(scheduleModel);

    const grouped = {
      [WorkerType.NURSE]: [] as string[][],
      [WorkerType.OTHER]: [] as string[][],
    };
    Object.keys(scheduleModel.shifts || {}).forEach((key: string) => {
      const category = scheduleModel.employee_info.type[key] ?? "";
      const shiftsRow: string[] = [
        key,
        ...scheduleModel.shifts[key]?.map((s) => (s === ShiftCode.W ? "W" : s)),
        ...shiftInfoLogics[category].calculateWorkerHourInfo(key).map((e) => e.toString()),
      ];
      grouped[category].push(shiftsRow);
    });
    return [grouped[WorkerType.NURSE], grouped[WorkerType.OTHER]];
  }

  private createHeader(scheduleModel: ScheduleDataModel): string[] {
    const headerRow = { [MetaDataRowLabel]: "" };
    headerRow[MetaDataSectionKey.Month] =
      TranslationHelper.polishMonths[scheduleModel?.schedule_info?.month_number || 0];
    headerRow[MetaDataSectionKey.Year] = scheduleModel?.schedule_info?.year || 0;
    // TODO implement work time calculation
    headerRow[MetaDataSectionKey.RequiredavailableWorkersWorkTime] = 0;
    return Object.keys(headerRow).map((key) => `${key} ${headerRow[key]}`);
  }

  private createChildrenInfoSection(
    scheduleModel: ScheduleDataModel
  ): (number | ChildrenSectionKey)[][] {
    // in case if it will be more complecated section
    return [
      [
        ChildrenSectionKey.RegisteredChildrenCount,
        ...(scheduleModel.month_info?.children_number || []),
      ],
    ];
  }

  private createWorkHoursInfoHeader(startIndex: number): string[] {
    const header = Array(startIndex + 3).fill("");

    header[startIndex] = TranslationHelper.workHoursInfoHeader.requiredHours;
    header[startIndex + 1] = TranslationHelper.workHoursInfoHeader.actualHours;
    header[startIndex + 2] = TranslationHelper.workHoursInfoHeader.overtime;
    return header;
  }

  private createDatesSection(scheduleModel: ScheduleDataModel): (number | MetaDataSectionKey)[][] {
    return [[MetaDataSectionKey.MonthDays, ...(scheduleModel?.month_info?.dates || [])]];
  }

  private saveToFile(workbook: xlsx.Workbook, filename: string): void {
    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer]);
      this.saveFileAs(blob, filename);
    });
  }

  private saveFileAs(blob, filename: string): void {
    const anchor = document.createElement("a");

    anchor.download = filename;
    anchor.href = URL.createObjectURL(blob);

    document.body.appendChild(anchor);

    // eslint-disable-next-line
    // @ts-ignore
    if (window.Cypress) {
      return;
    }

    anchor.click();
  }

  private shiftInfoLogics(
    scheduleModel: ScheduleDataModel
  ): { [WorkerType.NURSE]: ShiftsInfoLogic; [WorkerType.OTHER]: ShiftsInfoLogic } {
    const metadataLogic = new MetadataLogic(
      scheduleModel.schedule_info.year?.toString(),
      scheduleModel.schedule_info.month_number,
      scheduleModel.month_info.dates,
      scheduleModel.schedule_info.daysFromPreviousMonthExists
    );
    const nurseShiftsInfoLogic = new ShiftsInfoLogic(
      scheduleModel.shifts,
      WorkerType.NURSE,
      metadataLogic
    );
    const otherShiftsInfoLogic = new ShiftsInfoLogic(
      scheduleModel.shifts,
      WorkerType.OTHER,
      metadataLogic
    );

    const shiftInfoLogic = {
      [WorkerType.NURSE]: nurseShiftsInfoLogic,
      [WorkerType.OTHER]: otherShiftsInfoLogic,
    };

    return shiftInfoLogic;
  }
}
