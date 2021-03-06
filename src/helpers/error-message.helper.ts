/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import {
  ScheduleErrorLevel,
  ScheduleErrorMessageModel,
  ScheduleErrorType,
} from "../common-models/schedule-error-message.model";
import {
  AlgorithmErrorCode,
  GroupedScheduleErrors,
  InputFileErrorCode,
  NetworkErrorCode,
  ParseErrorCode,
  ScheduleError,
} from "../common-models/schedule-error.model";
import { SHIFTS as shifts } from "../common-models/shift-info.model";
import { ColorHelper } from "./colors/color.helper";
import { Color, Colors } from "./colors/color.model";
import { ShiftHelper } from "./shifts.helper";

type Error = ScheduleErrorLevel;

export class ErrorMessageHelper {
  public static mapScheduleErrors(errors: GroupedScheduleErrors): ScheduleErrorMessageModel[] {
    const mappedErrors = Object.values(errors).reduce(
      (previous, current) => [
        ...previous,
        ...(current ?? []).map(ErrorMessageHelper.getErrorMessage),
      ],
      [] as ScheduleErrorMessageModel[]
    );
    return mappedErrors;
  }

  public static getErrorMessage(error: ScheduleError): ScheduleErrorMessageModel {
    const kind = error.kind;
    let message: string;
    let title = "Nie rozpoznano błędu";
    let day = 0;
    let i = 0;
    let type = ScheduleErrorType.OTH;

    switch (error.kind) {
      case AlgorithmErrorCode.AlwaysAtLeastOneNurse:
        i = 0;
        message = `Brak pielęgniarek`;
        if (error.segments[i][0] !== 1 || error.segments[i][1] !== 24) {
          message += ` w godzinach <strong>${error.segments[i][0]}-${error.segments[i][1]}</strong>`;
        }
        while (error.segments[i + 1]) {
          i++;
          if (error.segments[i][0] !== 1 || error.segments[i][1] !== 24) {
            message += `, <strong>${error.segments[i][0]}-${error.segments[i][1]}</strong>`;
          }
        }
        type = ScheduleErrorType.AON;
        title = "date";
        if (error.day) {
          day += error.day;
        }
        break;
      case AlgorithmErrorCode.WorkerNumberDuringDay:
        i = 0;
        message = `Za mało pracowników w trakcie dnia`;
        if (error.segments && (error.segments[i][0] !== 6 || error.segments[i][1] !== 22)) {
          message += ` w godzinach <strong>${error.segments[i][0]}-${error.segments[i][1]}</strong>`;
          while (error.segments[i + 1]) {
            i++;
            if (error.segments[i][0] !== 6 || error.segments[i][1] !== 22) {
              message += `, <strong>${error.segments[i][0]}-${error.segments[i][1]}</strong>`;
            }
          }
        }
        message += `: potrzeba <strong>${error.required}</strong>, jest <strong>${error.actual}</strong>`;
        type = ScheduleErrorType.WND;
        title = "date";
        if (error.day) {
          day += error.day;
        }
        break;
      case AlgorithmErrorCode.WorkerNumberDuringNight:
        i = 0;
        message = `Za mało pracowników w nocy`;
        if (error.segments && (error.segments[i][0] !== 22 || error.segments[i][1] !== 6)) {
          message += ` w godzinach <strong>${error.segments[i][0]}-${error.segments[i][1]}</strong>`;
          while (error.segments[i + 1]) {
            i++;
            if (error.segments[i][0] !== 22 || error.segments[i][1] !== 6) {
              message += `, <strong>${error.segments[i][0]}-${error.segments[i][1]}</strong>`;
            }
          }
        }
        message += `: potrzeba <strong>${error.required}</strong>, jest <strong>${error.actual}</strong>`;
        type = ScheduleErrorType.WNN;
        title = "date";
        if (error.day) {
          day += error.day;
        }
        break;
      case AlgorithmErrorCode.DissalowedShiftSequence:
        const timeNeeded = ShiftHelper.requiredFreeTimeAfterShift(shifts[error.preceding]);
        const earliestPossible = ShiftHelper.nextLegalShiftStart(shifts[error.preceding])[0];
        const nextDay = ShiftHelper.nextLegalShiftStart(shifts[error.preceding])[1];
        let tooEarly =
          ShiftHelper.nextLegalShiftStart(shifts[error.preceding])[0] -
          shifts[error.succeeding].from;
        if (tooEarly == 0) tooEarly += 24;
        message = `Pracownik <strong>${
          error.worker
        }</strong> potrzebuje ${timeNeeded} godzin przerwy po zmianie <strong>${
          error.preceding
        }</strong>
          (${shifts[error.preceding].from}-${shifts[error.preceding].to}).
          Najwcześniej o ${earliestPossible}`;
        if (nextDay) message += ` następnego dnia`;
        message += `. Przypisana zmiana <strong>${error.succeeding}</strong> (${
          shifts[error.succeeding].from
        }-${shifts[error.succeeding].to}) zaczyna się
        o ${tooEarly} godzin`;
        switch (tooEarly) {
          case 1:
            message += `ę za wcześnie`;
            break;
          case 2:
          case 3:
          case 4:
          case 22:
          case 23:
          case 24:
            message += `y za wcześnie`;
            break;
          default:
            message += ` za wcześnie`;
            break;
        }
        type = ScheduleErrorType.DSS;
        title = "date";
        if (error.day) {
          day += error.day;
        }
        break;
      case AlgorithmErrorCode.LackingLongBreak:
        message = `Brak wymaganej długiej przerwy dla pracownika <strong>${
          error.worker
        }</strong> w tygodniu <strong>${error.week + 1}</strong>`;
        type = ScheduleErrorType.LLB;
        title = `${error.worker}`;
        break;
      case AlgorithmErrorCode.WorkerUnderTime:
        message = `Pracownik <strong>${error.worker}</strong> ma <strong>${error.hours}</strong> niedogodzin`;
        type = ScheduleErrorType.WUH;
        title = `${error.worker}`;
        break;
      case AlgorithmErrorCode.WorkerOvertime:
        message = `Pracownik <strong>${error.worker}</strong> ma <strong>${error.hours}</strong> nadgodzin`;
        type = ScheduleErrorType.WOH;
        title = `${error.worker}`;
        break;
      case ParseErrorCode.UNKNOWN_VALUE:
        message = `Nieznana wartość zmiany: "${error.actual}" dla pracownika  ${
          error.worker
        } w dniu ${error.day! + 1}. Przyjęto, że zmiana to wolne.`;
        type = ScheduleErrorType.ILLEGAL_SHIFT_VALUE;
        title = `${error.worker}`;
        break;
      case InputFileErrorCode.EMPTY_FILE:
        message = `Błąd podczas wczytywania pliku wejściowego: Pusty plik`;
        break;
      case InputFileErrorCode.UNHANDLED_FILE_EXTENSION:
        message = `Nieobsługiwane rozszerzenie pliku: .${error.filename}`;
        break;
      case InputFileErrorCode.LOAD_FILE_ERROR:
        message = `${error.message}`;
        break;
      case NetworkErrorCode.NETWORK_ERROR:
        message = "Błąd połączenia";
        title = "Błąd połączenia";
        break;
      default:
        message = "Nieznany błąd";
        break;
    }
    const level = AlgorithmErrorCode[kind]
      ? ScheduleErrorLevel.CRITICAL_ERROR
      : ScheduleErrorLevel.WARNING;
    return { kind, title, day, message, level, type };
  }

  public static getErrorColor(error: Error): Color {
    return (
      {
        [ScheduleErrorLevel.INFO]: Colors.DARK_RED.fade(0.4),
        [ScheduleErrorLevel.WARNING]: Colors.TUSCANY.fade(0.4),
      }[error] ?? ColorHelper.getDefaultColor()
    );
  }
}
