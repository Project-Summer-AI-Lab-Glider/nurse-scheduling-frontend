/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import React, { useContext } from "react";
import { WorkerType } from "../../../../common-models/worker-info.model";
import { ShiftsSectionComponent } from "./sections/shifts-section/shifts-section.component";
import { ScheduleLogicContext } from "./use-schedule-state";
import { FoundationInfoComponent } from "./sections/foundation-info-section/foundation-info.component";
import { TimeTableComponent } from "../../../timetable/timetable.component";
import { NameTableComponent } from "../../../namestable/nametable.component";
import { SummaryTableComponent } from "../../../summerytable/summarytable.component";
import { OvertimeHeaderComponent } from "../../../overtime-header-table/overtime-header.component";
import { ScheduleComponentState } from "./schedule-state.model";
import { ScheduleFoldingSection } from "./schedule-parts/schedule-folding-section.component";
import { NewMonthPlanComponent } from "../../new-month-page.component";

interface ScheduleComponentOptions {
  schedule: ScheduleComponentState;
}
export function ScheduleComponent({
  schedule: scheduleLocalState,
}: ScheduleComponentOptions): JSX.Element {
  const scheduleLogic = useContext(ScheduleLogicContext);
  function isPresent(): boolean {
    if (scheduleLocalState.isInitialized && !scheduleLocalState.isAutoGenerated) {
      const a = scheduleLocalState.dateSection?.length;
      const b = scheduleLocalState.nurseShiftsSection?.length;
      const c = scheduleLocalState.babysitterShiftsSection?.length;
      if (a && b && b && c && a * b * c) {
        return true;
      }
    }
    if (!scheduleLocalState.isAutoGenerated) {
      scheduleLogic?.tryGetCurrentMonthSchedule();
    }
    return false;
  }

  return (
    <>
      {!isPresent() && <NewMonthPlanComponent />}
      {isPresent() && (
        <table style={{ margin: 20 }}>
          <tbody>
            <tr className="sectionContainer">
              <td />
              <td>
                <TimeTableComponent scheduleLocalState={scheduleLocalState} />
              </td>
              <td className="summaryContainer">
                <OvertimeHeaderComponent data={["norma", "aktualne", "różnica"]} />
              </td>
            </tr>
            <ScheduleFoldingSection name="Pielęgniarki">
              <tr className="sectionContainer">
                <td>
                  <NameTableComponent
                    uuid={scheduleLocalState.uuid}
                    workerType={WorkerType.NURSE}
                    data={scheduleLocalState.nurseShiftsSection}
                  />
                </td>
                <td>
                  <table>
                    <tbody className="table" data-cy="nurseShiftsTable">
                      <ShiftsSectionComponent
                        uuid={scheduleLocalState.uuid}
                        workerType={WorkerType.NURSE}
                        data={scheduleLocalState.nurseShiftsSection}
                      />
                    </tbody>
                  </table>
                </td>
                <td className="summaryContainer">
                  <SummaryTableComponent
                    uuid={scheduleLocalState.uuid}
                    data={scheduleLocalState.nurseShiftsSection}
                    workerType={WorkerType.NURSE}
                  />
                </td>
              </tr>
            </ScheduleFoldingSection>

            <ScheduleFoldingSection name="Opiekunowie">
              <tr className="sectionContainer">
                <td>
                  <NameTableComponent
                    uuid={scheduleLocalState.uuid}
                    workerType={WorkerType.OTHER}
                    data={scheduleLocalState.babysitterShiftsSection}
                  />
                </td>
                <td>
                  <table>
                    <tbody className="table" data-cy="otherShiftsTable">
                      <ShiftsSectionComponent
                        uuid={scheduleLocalState.uuid}
                        workerType={WorkerType.OTHER}
                        data={scheduleLocalState.babysitterShiftsSection}
                      />
                    </tbody>
                  </table>
                </td>
                <td className="summaryContainer">
                  <SummaryTableComponent
                    uuid={scheduleLocalState.uuid}
                    data={scheduleLocalState.babysitterShiftsSection}
                    workerType={WorkerType.OTHER}
                  />
                </td>
              </tr>
            </ScheduleFoldingSection>

            <ScheduleFoldingSection name="Informacje">
              <tr className="sectionContainer">
                <td>
                  <NameTableComponent
                    uuid={scheduleLocalState.uuid}
                    data={scheduleLocalState.foundationInfoSection}
                  />
                </td>
                <td>
                  <table>
                    <tbody className="table" data-cy="foundationInfoSection">
                      <FoundationInfoComponent
                        uuid={scheduleLocalState.uuid}
                        data={scheduleLocalState.foundationInfoSection}
                      />
                    </tbody>
                  </table>
                </td>
                <td />
              </tr>
            </ScheduleFoldingSection>
          </tbody>
        </table>
      )}
    </>
  );
}
