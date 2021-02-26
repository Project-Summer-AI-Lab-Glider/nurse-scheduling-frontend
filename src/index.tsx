/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import App from "./app";
import "./assets/styles/styles-all.scss";
import * as serviceWorker from "./serviceWorker";
import { appStore } from "./state/app-store";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { AppConfigProvider } from "./state/app-config-context";

ReactDOM.render(
  <DndProvider backend={HTML5Backend}>
    <BrowserRouter>
      <React.StrictMode>
        <Provider store={appStore}>
          <AppConfigProvider>
            <App />
          </AppConfigProvider>
        </Provider>
      </React.StrictMode>
    </BrowserRouter>
  </DndProvider>,
  document.getElementById("root")
);
/* eslint-disable @typescript-eslint/no-explicit-any */
if ((window as any).Cypress) {
  (window as any).store = appStore;
}
// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
