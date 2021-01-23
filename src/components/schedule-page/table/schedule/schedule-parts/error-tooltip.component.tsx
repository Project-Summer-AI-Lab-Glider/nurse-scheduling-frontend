import React, { CSSProperties, ReactNode, useRef, useState } from "react";
import { usePopper } from "react-popper";
import { useSelector } from "react-redux";
import {
  GroupedScheduleErrors,
  ScheduleError,
} from "../../../../../common-models/schedule-error.model";
import { ErrorMessageHelper } from "../../../../../helpers/error-message.helper";
import { ApplicationStateModel } from "../../../../../state/models/application-state.model";
import ErrorListItem from "../../../validation-drawer/error-list-item.component";
import { Popper } from "./base-cell/popper";

export interface ErrorTooltipOptions {
  children: ReactNode;
  errorSelector?: (scheduleErrors: GroupedScheduleErrors) => ScheduleError[];
  className?: string;
  showErrorTitle?: boolean;
  errorTriangleStyle?: CSSProperties;
}

export function ErrorTooltip({
  showErrorTitle,
  children,
  errorSelector,
  className,
  errorTriangleStyle = {},
}: ErrorTooltipOptions): JSX.Element {
  const errors = useSelector(
    (state: ApplicationStateModel) => errorSelector?.(state.actualState.scheduleErrors) ?? []
  );
  const errorTriangle = useRef<HTMLDivElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [isToolTipOpen, setToolTipOpen] = useState(false);
  const { styles, attributes } = usePopper(errorTriangle.current, tooltipRef.current);
  const [isFixed, setIsFixed] = useState(false);

  function showErrorTooltip(): void {
    setToolTipOpen(true);
  }

  function hideErrorTooltip(ignoreFixed = false): void {
    if (!isFixed || (ignoreFixed && isFixed)) {
      setToolTipOpen(false);
      setIsFixed(false);
    }
  }

  function handeTriangleClick(): void {
    if (!isFixed) {
      setIsFixed(true);
    } else {
      hideErrorTooltip(true);
    }
  }
  return (
    <>
      <Popper
        ref={tooltipRef}
        className="errorTooltip"
        isOpen={isToolTipOpen}
        {...attributes}
        style={{
          ...styles,
          marginLeft: container.current?.offsetWidth,
        }}
        onMouseLeave={(): void => hideErrorTooltip(false)}
      >
        {errors.map((error) => (
          <ErrorListItem
            error={ErrorMessageHelper.getErrorMessage(error)}
            interactable={false}
            className="errorTootlip-item"
            showTitle={showErrorTitle}
          />
        ))}
      </Popper>
      <div
        ref={container}
        className={className}
        style={{
          position: "relative",
        }}
      >
        {errors.length !== 0 && (
          <span
            onMouseEnter={showErrorTooltip}
            ref={errorTriangle}
            className="error-triangle"
            onMouseLeave={(): void => hideErrorTooltip(false)}
            onClick={handeTriangleClick}
            style={errorTriangleStyle}
          />
        )}
        {children}
      </div>
    </>
  );
}

// export const ErrorTooltip = React.forwardRef(ErrorTooltipF);
