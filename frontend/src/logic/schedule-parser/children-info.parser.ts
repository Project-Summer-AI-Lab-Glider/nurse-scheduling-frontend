import { DataRowParser } from "./data-row.parser";
import { MetaDataParser } from "./metadata.parser";
import { ChildrenInfoProvider } from "../schedule-provider";
import { ChildrenSectionKey } from "../models/children-section.model";
import { DataRowHelper } from "../../helpers/data-row.helper";

export class ChildrenInfoParser implements ChildrenInfoProvider {
  private readonly _sectionData: { [rowKey in ChildrenSectionKey]?: DataRowParser };

  constructor(childrenInfoSectionRows: DataRowParser[], metaData: MetaDataParser) {
    const processedSection = childrenInfoSectionRows
      .map((row) => row.cropData(metaData.validDataStart, metaData.validDataEnd + 1))
      .filter((row) => this.isValidRow(row));

    this._sectionData = DataRowHelper.dataRowsAsDataRowDict(processedSection);
  }

  public get registeredChildrenNumber() {
    return (
      this._sectionData[ChildrenSectionKey.RegisteredChildrenCount]
        ?.rowData(true, false)
        .map((i) => parseInt(i)) ?? []
    );
  }

  public get sectionData(): DataRowParser[] {
    const values = Object.values(this._sectionData).filter((row) => !!row) as DataRowParser[];
    return values;
  }

  private isValidRow(row: DataRowParser): boolean {
    const validKey = Object.values(ChildrenSectionKey).find((k) => k === row.rowKey);
    if (validKey) {
      return true;
    } else {
      // TODO Add logger
      return false;
    }
  }
}
