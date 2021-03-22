/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import xlsx from "exceljs";
import JSZip from "jszip";
import _ from "lodash";
import { TranslationHelper } from "./translations.helper";
import {
  getRevisionTypeFromKey,
  RevisionType,
  RevisionTypeLabels,
} from "../api/persistance-store.model";
import { MonthDataModel } from "../common-models/schedule-data.model";
import { LocalStorageProvider } from "../api/local-storage-provider.model";
import { ScheduleExportLogic } from "../logic/schedule-exporter/schedule-export.logic";

type FilenamesToDirnameDict = { [dirName: string]: string[] };
export type WorkbookToFilename = { [name: string]: xlsx.Workbook };

export class FileHelper {
  public static saveToFile(workbook: xlsx.Workbook, filename: string): void {
    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer]);
      this.saveFileAs(blob, filename);
    });
  }

  public static async saveMultipleFiles(workbooks: WorkbookToFilename): Promise<void> {
    const zip = new JSZip();
    const splitWorkbooks = this.splitWorkbooksInDirs(workbooks);
    for (const dirName of Object.keys(splitWorkbooks)) {
      const dir = zip.folder(dirName);
      for (const fileName of splitWorkbooks[dirName]) {
        const buffer = await workbooks[fileName].xlsx.writeBuffer();
        const blob = new Blob([buffer]);
        dir?.file(fileName, blob);
      }
    }
    const zipFile = await zip.generateAsync({ type: "blob" });
    const timestamp = new Date().toLocaleDateString("pl").replaceAll(".", "_");
    this.saveFileAs(zipFile, `historia_${timestamp}`);
  }

  private static splitWorkbooksInDirs(workbooks): FilenamesToDirnameDict {
    const monthWorkbooks: FilenamesToDirnameDict = {};
    Object.keys(workbooks).forEach((fileName) => {
      const dirName = this.createDirNameFromFile(fileName);
      const files = monthWorkbooks[dirName];
      if (_.isNil(files)) {
        monthWorkbooks[dirName] = [fileName];
      } else {
        monthWorkbooks[dirName].push(fileName);
      }
    });
    return monthWorkbooks;
  }

  public static saveFileAs(blob, filename: string): void {
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

  public static createDirNameFromFile(fileName): string {
    const splitedName = fileName.split("_");
    return `${splitedName[0]}_${splitedName[1]}`;
  }

  public static createMonthFilename(
    monthDataModel: MonthDataModel,
    revisionType: RevisionType
  ): string {
    return (
      TranslationHelper.polishMonths[monthDataModel.scheduleKey.month] +
      `_${monthDataModel.scheduleKey.year}` +
      `_${RevisionTypeLabels[revisionType].replace(" ", "_")}` +
      ".xlsx"
    );
  }

  public static handleDbDump = async (): Promise<void> => {
    const docs = await new LocalStorageProvider().getAllSchedules();

    const workbooks: WorkbookToFilename = {};

    Object.keys(docs)
      .filter((revisionKey) => !docs[revisionKey].isAutoGenerated)
      .forEach((revisionKey) => {
        const [name, workbook] = new ScheduleExportLogic({
          scheduleModel: docs[revisionKey],
        }).createWorkbook(getRevisionTypeFromKey(revisionKey), docs[revisionKey].shift_types);
        workbooks[name] = workbook;
      });

    await FileHelper.saveMultipleFiles(workbooks);
  };
}
