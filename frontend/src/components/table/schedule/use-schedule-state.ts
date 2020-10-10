import { Dispatch, useReducer, useState } from "react";
import { ScheduleLogic } from "../../../logic/real-schedule-logic/schedule.logic";
import { ActionModel } from "../../../state/models/action.model";
import { ScheduleDataModel } from "../../../state/models/schedule-data/schedule-data.model";
import {
  ScheduleActionType,
  ScheduleComponentState,
  scheduleInitialState,
} from "./schedule-state.model";

export function useScheduleState(): [
  ScheduleComponentState,
  Dispatch<ActionModel<ScheduleComponentState>>,
  (scheduleData: ScheduleDataModel) => void,
  ScheduleLogic,
  boolean
] {
  const [isInitialiazed, setIsInitialiazed] = useState<boolean>(false);
  const [scheduleLogic, setScheduleLogic] = useState<ScheduleLogic>(new ScheduleLogic({}));
  const [scheduleState, dispatchScheduleState] = useReducer(
    (state: ScheduleComponentState, action: ActionModel<ScheduleComponentState>) => {
      let data;
      switch (action.type) {
        case ScheduleActionType.UpdateFullState:
          setIsInitialiazed(true);
          return { ...action.payload, isScheduleModified: false };
        case ScheduleActionType.UpdateNurseShiftSection:
          data = action.payload.nurseShiftsSection;
          scheduleLogic && scheduleLogic.updateNurseSection(data);
          return { ...state, nurseShiftsSection: data, isScheduleModified: true };
        case ScheduleActionType.UpdateBabysitterShiftSection:
          data = action.payload.babysitterShiftsSection;
          scheduleLogic && scheduleLogic.updateBabysitterSection(data);
          return { ...state, babysitterShiftsSection: data, isScheduleModified: true };
        case ScheduleActionType.UpdateChildrenShiftSection:
          data = action.payload.childrenSection;
          scheduleLogic && scheduleLogic.updateChildrenSection(data);
          return { ...state, childrenSection: data, isScheduleModified: true };
        default:
          return state;
      }
    },
    scheduleInitialState
  );

  const setNewSchedule = (scheduleModel: ScheduleDataModel) => {
    const logic = new ScheduleLogic(scheduleModel);
    const newState = {
      nurseShiftsSection: logic.getNurseInfo().sectionData,
      babysitterShiftsSection: logic.getBabySitterInfo().sectionData,
      childrenSection: logic.getChildrenInfo().sectionData,
      dateSection: logic.getMetadata().sectionData,
    };

    setScheduleLogic(logic);
    dispatchScheduleState({
      type: ScheduleActionType.UpdateFullState,
      payload: newState,
    });
  };

  return [scheduleState, dispatchScheduleState, setNewSchedule, scheduleLogic, isInitialiazed];
}
