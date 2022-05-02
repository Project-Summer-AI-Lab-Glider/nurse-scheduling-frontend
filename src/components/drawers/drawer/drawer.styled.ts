/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { Drawer as MaterialDrawer } from "@material-ui/core";
import styled from "styled-components";
import { headerHeight } from "../../../assets/css-consts";

export const Drawer = styled(MaterialDrawer)<{ isFullHeight?: boolean }>`
  & > [class*="paper"] {
    margin-top: ${({ isFullHeight }) => (isFullHeight ? 0 : headerHeight)};
    min-width: 500px;
    overflow: hidden;
    background-color: ${({ theme }) => theme.gray};
  }
`;
