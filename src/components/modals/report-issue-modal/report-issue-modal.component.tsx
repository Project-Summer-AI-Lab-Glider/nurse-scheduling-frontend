/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { TextField } from "@material-ui/core";
import React, { useState } from "react";
import { Button } from "../../buttons/button-component/button.component";
import DefaultModal from "../modal.component";
import { send } from "emailjs-com";
import { useNotification } from "../../notification/notification.context";
import { t } from "../../../helpers/translations.helper";
import styled from "styled-components";

export interface ReportIssueModalOptions {
  setOpen: (open: boolean) => void;
  open: boolean;
  clear?: () => void;
}

export default function ReportIssueModal(options: ReportIssueModalOptions): JSX.Element {
  const [isSent, setIsSent] = useState(false);
  const { open, setOpen, clear } = options;

  const [issueDescription, setIssueDescription] = useState("");
  const title = t("reportError");
  const { createNotification } = useNotification();

  function onIssueDescriptionChange(event): void {
    const { value } = event.target;
    setIssueDescription(value);
  }

  function handleClose(): void {
    clear && clear();
    setIssueDescription("");
    setIsSent(false);
    setOpen(false);
  }

  function handleSend(): void {
    send(
      "service_74nkmaq",
      "template_120y7az",
      {
        message: issueDescription,
      },
      process.env.REACT_APP_EMAIL_KEY
    )
      .then(() => {
        setIsSent(true);
      })
      .catch(() => {
        createNotification({ type: "error", message: t("thereWasNetworkingError") });
        handleClose();
      });
  }

  // Only for testing purposes
  if (
    process.env.REACT_APP_TEST_MODE &&
    issueDescription.toLowerCase() === process.env.REACT_APP_ERROR_WORKER
  ) {
    throw new Error("[TEST MODE] Error message was entered");
  }

  const body = (
    <div>
      {isSent && <Message>{t("errorMessageWasSent")}</Message>}
      {!isSent && (
        <>
          <Message>{t("whatErrorOccurred")}</Message>
          <Input
            // className={classes.textField}
            placeholder={t("provideErrorDescription")}
            value={issueDescription}
            onChange={onIssueDescriptionChange}
            fullWidth={true}
            multiline
            helperText={
              issueDescription.length > 19
                ? " "
                : `Treść wiadomości jest za krótka! Wprowadź jeszcze min. ${
                    19 - issueDescription.length + 1
                  } znak${
                    issueDescription.length < 16 ? `ów` : issueDescription.length < 19 ? `i` : ``
                  }.`
            }
          />
        </>
      )}
    </div>
  );

  const footer = (
    <div>
      {!isSent && (
        <>
          <Button variant="primary" onClick={handleSend} disabled={issueDescription.length < 20}>
            {t("send")}
          </Button>
          <Button variant="secondary" color="secondary" onClick={handleClose}>
            {t("cancel")}
          </Button>
        </>
      )}
      {isSent && (
        <Button variant="primary" onClick={handleClose}>
          {t("close")}
        </Button>
      )}
    </div>
  );

  return (
    <DefaultModal
      open={open}
      setOpen={setOpen}
      title={title}
      body={body}
      footer={footer}
      closeOptions={handleClose}
    />
  );
}

const Message = styled.p`
  font-weight: bolder;
  letter-spacing: 0.75px;
`;

const Input = styled(TextField)`
  letter-spacing: 0.25px;
  margin-top: 0;
`;
