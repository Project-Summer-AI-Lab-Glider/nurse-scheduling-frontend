import { ShiftHelper } from "../../helpers/shifts.helper";
import { StringHelper } from "../../helpers/string.helper";
import { WorkerType } from "../../common-models/worker-info.model";
import { ScheduleDataModel } from "../../common-models/schedule-data.model";
import { Schedule, ScheduleProvider, Sections } from "../providers/schedule-provider.model";
import { ChildrenInfoLogic } from "./children-info.logic";
import { DataRow } from "./data-row";
import { ExtraWorkersLogic } from "./extra-workers.logic";
import { MetadataLogic } from "./metadata.logic";
import { ShiftsInfoLogic } from "./shifts-info.logic";
import { ChildrenSectionKey, ExtraWorkersSectionKey } from "../section.model";
import { PersistanceStoreProvider, RevisionFilter } from "../../api/persistance-store.model";
import {
  ScheduleActionModel,
  ScheduleDataActionType,
} from "../../state/reducers/schedule-data.reducer";
import { FoundationInfoLogic } from "./foundation-info.logic";
import { FoundationInfoOptions } from "../providers/foundation-info-provider.model";
import { ThunkDispatch } from "redux-thunk";
import { ApplicationStateModel } from "../../state/models/application-state.model";
import { SelectionMatrix } from "../../components/schedule-page/table/schedule/sections/base-section/use-selection-matrix";
import { BaseSectionLogic } from "./base-section-logic.model";

export class ScheduleLogic implements ScheduleProvider {
  schedule!: Schedule;
  sections!: Sections;
  uuid!: string;
  constructor(
    private dispatchScheduleUpdate: ThunkDispatch<ApplicationStateModel, void, ScheduleActionModel>,
    private storeProvider: PersistanceStoreProvider,
    scheduleModel: ScheduleDataModel,
    private mode: "edit" | "readonly"
  ) {
    this.update(scheduleModel);
  }

  public disableEdit() {
    Object.values(this.sections).forEach((section) => {
      (section as BaseSectionLogic).disableEdit();
    });
  }

  public update(schedule: ScheduleDataModel): void {
    this.uuid = schedule.schedule_info.UUID ?? "";
    this.sections = this.createSections(schedule);
    this.schedule = new Schedule(this);
    if (this.mode === "readonly") {
      this.disableEdit();
    }
  }

  public createSections(scheduleModel: ScheduleDataModel): Sections {
    const {
      [WorkerType.NURSE]: nurseShifts,
      [WorkerType.OTHER]: babysitterShifts,
    } = ShiftHelper.groupShiftsByWorkerType(
      scheduleModel.shifts,
      scheduleModel.employee_info?.type
    );
    const childrenSectionData = {
      [ChildrenSectionKey.RegisteredChildrenCount]: scheduleModel.month_info?.children_number || [],
    };
    const extraWorkerSectionData = {
      [ExtraWorkersSectionKey.ExtraWorkersCount]: scheduleModel.month_info?.extra_workers || [],
    };
    const scheduleInfo = scheduleModel.schedule_info;
    const metadata = new MetadataLogic(
      scheduleInfo.year?.toString(),
      scheduleInfo.month_number,
      scheduleModel.month_info?.dates,
      scheduleInfo.daysFromPreviousMonthExists
    );
    const logics: FoundationInfoOptions = {
      BabysitterInfo: new ShiftsInfoLogic(babysitterShifts, WorkerType.OTHER, metadata),
      NurseInfo: new ShiftsInfoLogic(nurseShifts, WorkerType.NURSE, metadata),
      ChildrenInfo: new ChildrenInfoLogic(childrenSectionData),
      ExtraWorkersInfo: new ExtraWorkersLogic(extraWorkerSectionData),
    };

    const foundationLogic = new FoundationInfoLogic(logics);
    return {
      BabysitterInfo: logics.BabysitterInfo,
      NurseInfo: logics.NurseInfo,
      FoundationInfo: foundationLogic,
      Metadata: metadata,
    };
  }

  public tryGetCurrentMonthSchedule(): void {
    const [month, year] = this.sections.Metadata.monthLogic.currentDate;
    const filter: RevisionFilter = { revisionType: "actual", validityPeriod: { month, year } };
    this.dispatchScheduleUpdate(this.storeProvider.getScheduleRevision(filter));
  }

  public updateActualRevision(): void {
    this.dispatchScheduleUpdate(
      this.storeProvider.saveScheduleRevision("actual", this.schedule.getDataModel())
    );
  }

  public changeShiftFrozenState(rowind: number, shiftIndex: number): void {
    if (!this.sections.Metadata) return;
    this.sections.Metadata.changeShiftFrozenState(rowind, shiftIndex);
    this.updateGlobalState();
  }

  public getWorkerTypes(): {} {
    const result = {};
    this.sections.BabysitterInfo.workers.forEach((babysitter) => {
      result[babysitter] = WorkerType.OTHER;
    });
    this.sections.NurseInfo.workers.forEach((nurse) => {
      result[nurse] = WorkerType.NURSE;
    });
    return result;
  }

  public findRowByKey(schedule, key: string): [DataRow | undefined, number] {
    const index = schedule.findIndex(
      (row: DataRow) =>
        !row.isEmpty && StringHelper.getRawValue(row.rowKey) === StringHelper.getRawValue(key)
    );
    const data = schedule[index];
    return [data, index];
  }

  public updateSection(
    sectionKey: keyof Sections,
    selectionMatrix: SelectionMatrix,
    newValue: string
  ): boolean {
    const section = Object.values(this.sections).find(
      (provider) => provider.sectionKey === sectionKey
    );
    if (section) {
      section.update(selectionMatrix, newValue);
      this.updateGlobalState();
      return true;
    }
    return false;
  }

  public addWorker(
    sectionKey: keyof Sections,
    newWorkerRow: DataRow,
    workerWorkTime: number
  ): void {
    const newSectionContent = (Object.values(this.sections)?.find(
      (provider) => provider.sectionKey === sectionKey
    ) as ShiftsInfoLogic)?.addWorker(newWorkerRow, workerWorkTime);
    if (newSectionContent) {
      this.updateGlobalState();
    }
  }

  public addRow(sectionKey: keyof Sections, newRow: DataRow): void {
    const newSectionContent = Object.values(this.sections)
      ?.find((provider) => provider.sectionKey === sectionKey)
      ?.addDataRow(newRow);
    if (newSectionContent) {
      this.updateGlobalState();
    }
  }

  public getSection<T>(sectionKey: keyof Sections): T | undefined {
    return Object.values(this.sections).find((provider) => provider.sectionKey === sectionKey);
  }

  private updateGlobalState(): void {
    const model = this.schedule.getDataModel();
    this.dispatchScheduleUpdate({
      type: ScheduleDataActionType.UPDATE,
      payload: model,
    });
  }
}
