/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import React, { useContext } from "react";
import { Button } from "../../common-components";
import { ScheduleErrorMessageModel } from "../../../common-models/schedule-error-message.model";
import { ScheduleLogicContext } from "../table/schedule/use-schedule-state";
import { TranslationHelper } from "../../../helpers/translations.helper";
import { ApplicationStateModel } from "../../../state/models/application-state.model";
import { useSelector } from "react-redux";

interface Options {
  error: ScheduleErrorMessageModel;
  interactable?: boolean;
  className?: string;
  showTitle?: boolean;
}

export default function ErrorListItem({
  error,
  interactable = true,
  className = "",
  showTitle = true,
}: Options): JSX.Element {
  /* eslint-disable @typescript-eslint/camelcase */
  const { month_number } = useSelector(
    (state: ApplicationStateModel) => state.actualState.temporarySchedule.present.schedule_info
  );

  let currMonthGenetivus = "";
  let prevMonthGenetivus = "";
  if (month_number) {
    currMonthGenetivus = `${TranslationHelper.polishMonthsGenetivus[month_number]}`;
    if (month_number > 0) {
      prevMonthGenetivus = `${TranslationHelper.polishMonthsGenetivus[month_number - 1]}`;
    } else {
      prevMonthGenetivus = `${TranslationHelper.polishMonthsGenetivus[month_number + 11]}`;
    }
  }

  const scheduleLogic = useContext(ScheduleLogicContext);
  const mappedDays = scheduleLogic?.sections.Metadata?.verboseDates.map((d) => d.date);

  const monthStartIndex = scheduleLogic?.sections.Metadata?.dates.findIndex((d) => d === 1) ?? 0;

  let errorDayIndex = -1;
  let errorDay = -1;
  if (error.day && mappedDays) {
    errorDayIndex = error.day - 1;
    errorDay = mappedDays[errorDayIndex];
  }

  const month = errorDayIndex < monthStartIndex ? prevMonthGenetivus : currMonthGenetivus;

  return (
    <div className={`error-list-item ${className}`}>
      <div className="red-rectangle" />
<<<<<<< HEAD
      <div className="error-title">
        <p className="error-title-content">
          {error.title === "date" ? `${errorDay} ` + month : `${error.title}`}
        </p>
      </div>
      <div className="error-text" dangerouslySetInnerHTML={{ __html: error.message || "" }} />
      <div className="error-btn">
        <Button variant="primary" id="error-buttons" style={{ width: "90px", height: "26px" }}>
          Pokaż
        </Button>
      </div>
=======
      {showTitle && (
        <div className="error-title">
          <p className="error-title-content">
            {error.title === "date" ? `${errorDay} ` + month : `${error.title}`}
          </p>
        </div>
      )}
      <div className="error-text">{error.message}</div>
      {interactable && (
        <div className="error-btn">
          <Button variant="primary" id="error-buttons" style={{ width: "90px", height: "26px" }}>
            Pokaż
          </Button>
        </div>
      )}
>>>>>>> 8419bc6 (Adds badges to namestable)
    </div>
  );
}
