/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { Grid, TextField, Typography } from "@material-ui/core";
import React, { useCallback, useEffect } from "react";
import { useSelector } from "react-redux";
import { ApplicationStateModel } from "../../../state/models/application-state.model";
import { FormFieldErrorLabelStack } from "./form-field-error-label.component";
import {
  FormFieldOptions,
  useFormFieldStyles,
  WorkerEditComponentMode,
} from "./worker-edit.models";

export interface WorkerNameEditFieldOptions extends FormFieldOptions {
  workerName: string;
  setWorkerName: (newWorkerName: string) => void;
  mode: WorkerEditComponentMode;
}

export function WorkerNameEditField({
  workerName,
  setWorkerName,
  setIsFieldValid,
  mode,
}: WorkerNameEditFieldOptions): JSX.Element {
  const classes = useFormFieldStyles();

  const workerNames = useSelector((state: ApplicationStateModel) =>
    Object.keys(state.actualState.persistentSchedule.present.employee_info.type)
  );

  const isWorkerWithSameNameExists = useCallback((): boolean => {
    const isWorkerNameInvalid =
      workerNames.includes((workerName ?? "").trim()) && mode !== WorkerEditComponentMode.EDIT;
    return isWorkerNameInvalid;
  }, [mode, workerName, workerNames]);

  const isWorkerNameEmpty = useCallback((): boolean => {
    return workerName === "";
  }, [workerName]);

  useEffect(() => {
    const isNameValid = !isWorkerNameEmpty() && !isWorkerWithSameNameExists();
    setIsFieldValid?.(isNameValid);
  }, [workerName, setIsFieldValid, isWorkerWithSameNameExists, isWorkerNameEmpty]);

  const nameFieldErrorLabels = [
    {
      condition: isWorkerWithSameNameExists(),
      message: `Pracownik o imieniu ${workerName} już istnieje`,
    },
    {
      condition: isWorkerNameEmpty(),
      message: `Imię dla pracownika powinno być zdefiniowane`,
    },
  ];

  return (
    <>
      <Grid item xs={6}>
        <Typography className={classes.label}>Imię i nazwisko</Typography>
        <TextField
          fullWidth
          name="workerName"
          className={classes.formInput}
          data-cy="name"
          value={workerName}
          onChange={(event): void => setWorkerName(event.target.value)}
          color="primary"
        />
        <FormFieldErrorLabelStack errorLabels={nameFieldErrorLabels} />
      </Grid>
    </>
  );
}
