/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { createSelector } from "@reduxjs/toolkit";
import { ScheduleMode } from "../../../components/schedule/schedule-state.model";
import { ApplicationStateModel } from "../../application-state.model";

const selectPresentSchedule = (state: ApplicationStateModel) =>
  state.actualState.persistentSchedule.present;
export const getPresentSchedule = createSelector(selectPresentSchedule, (state) => state);

const selectPresentScheduleInfo = (state: ApplicationStateModel) =>
  state.actualState.persistentSchedule.present.schedule_info;

export const getPresentScheduleInfo = createSelector(selectPresentScheduleInfo, (state) => state);

const selectPresentScheduleMonthInfo = (state: ApplicationStateModel) =>
  state.actualState.persistentSchedule.present.month_info;

export const getPresentScheduleMonthInfo = createSelector(
  selectPresentScheduleMonthInfo,
  (state) => state
);

const selectActualState = (state: ApplicationStateModel) => state.actualState;

export const getActualState = createSelector(selectActualState, (state) => state);

const selectPresentTemporarySchedule = (state: ApplicationStateModel) =>
  state.actualState.temporarySchedule?.present;

export const getPresentTemporarySchedule = createSelector(
  selectPresentTemporarySchedule,
  (state) => state
);

const selectPresentTemporaryScheduleInfo = (state: ApplicationStateModel) =>
  state.actualState.temporarySchedule.present.schedule_info;

export const getPresentTemporaryScheduleInfo = createSelector(
  selectPresentTemporaryScheduleInfo,
  (state) => state
);

const isEditMode = (state: ApplicationStateModel) => state.actualState.mode === ScheduleMode.Edit;

export const getIsEditMode = createSelector(isEditMode, (state) => state);

const selectPresentWorkerNames = (state: ApplicationStateModel) =>
  state.actualState.persistentSchedule.present.employee_info.type;

export const getPresentWorkerNames = createSelector(selectPresentWorkerNames, (state) =>
  Object.keys(state)
);

const selectPresentEmployeeInfo = (state: ApplicationStateModel) =>
  state.actualState.persistentSchedule.present.employee_info;

export const getPresentEmployeeInfo = createSelector(selectPresentEmployeeInfo, (state) => state);

const selectPresentShiftTypes = (state: ApplicationStateModel) =>
  state.actualState.persistentSchedule.present.shift_types;

export const getPresentShiftTypes = createSelector(selectPresentShiftTypes, (state) => state);

const selectSchedule = (
  state: ApplicationStateModel,
  targetSchedule: "temporarySchedule" | "persistentSchedule"
) => state.actualState[targetSchedule].present;

export const getSchedule = createSelector(selectSchedule, (state) => state);