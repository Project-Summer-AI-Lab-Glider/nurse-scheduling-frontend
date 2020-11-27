import React, { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { ScheduleLogic } from "../../../../logic/schedule-logic/schedule.logic";
import { ScheduleDataModel } from "../../../../common-models/schedule-data.model";
import { ScheduleComponentState, scheduleInitialState } from "./schedule-state.model";
import { LocalStorageProvider } from "../../../../api/local-storage-provider.model";
import { ShiftsInfoLogic } from "../../../../logic/schedule-logic/shifts-info.logic";
import { MetadataLogic } from "../../../../logic/schedule-logic/metadata.logic";
import { FoundationInfoLogic } from "../../../../logic/schedule-logic/foundation-info.logic";

// eslint-disable-next-line @typescript-eslint/class-name-casing
export interface useScheduleStateReturn {
  scheduleLogic: ScheduleLogic;
  scheduleLocalState: ScheduleComponentState;
  setNewSchedule: (scheduleModel: ScheduleDataModel) => void;
}

export const ScheduleLogicContext = React.createContext<ScheduleLogic | null>(null);

export function useScheduleState(
  initialScheduleModelState: ScheduleDataModel
): useScheduleStateReturn {
  const dispatchGlobalState = useDispatch();
  const [scheduleLocalState, setScheduleLocalState] = useState<ScheduleComponentState>(
    scheduleInitialState
  );

  const scheduleLogic = useState<ScheduleLogic>(
    new ScheduleLogic(dispatchGlobalState, new LocalStorageProvider(), initialScheduleModelState)
  )[0];

  const setNewSchedule = useCallback(
    (scheduleModel: ScheduleDataModel): void => {
      scheduleLogic.update(scheduleModel);
      setScheduleLocalState({
        nurseShiftsSection: (scheduleLogic.sections.NurseInfo as ShiftsInfoLogic).sectionData,
        babysitterShiftsSection: (scheduleLogic.sections.BabysitterInfo as ShiftsInfoLogic)
          .sectionData,
        foundationInfoSection: (scheduleLogic.sections.FoundationInfo as FoundationInfoLogic)
          .sectionData,
        dateSection: (scheduleLogic.sections.Metadata as MetadataLogic).sectionData,
        isInitialized: true,
        uuid: scheduleModel.schedule_info?.UUID?.toString() || "",
      });
    },
    [scheduleLogic]
  );

  return { scheduleLogic, scheduleLocalState, setNewSchedule };
}
