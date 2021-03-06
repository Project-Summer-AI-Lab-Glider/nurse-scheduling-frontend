/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import React from "react";
import { ScheduleComponentState } from "./table/schedule/schedule-state.model";
import { ScheduleComponent } from "./table/schedule/schedule.component";
import { NewScheduleComponent } from "./new-schedule.component";

interface ScheduleContainerOptions {
  schedule: ScheduleComponentState;
}

export function ScheduleContainerComponent({
  schedule: scheduleLocalState,
}: ScheduleContainerOptions): JSX.Element {
  const isPresent =
    scheduleLocalState.isInitialized &&
    !scheduleLocalState.isAutoGenerated &&
    scheduleLocalState.dateSection?.length;

  return (
    <>
      {isPresent ? <ScheduleComponent schedule={scheduleLocalState} /> : <NewScheduleComponent />}
    </>
  );
}
