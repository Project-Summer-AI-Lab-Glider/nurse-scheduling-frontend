/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import styled from "styled-components";
import { Box, IconButton, Paper, alpha } from "@material-ui/core";
import Fade from "@material-ui/core/Fade";
import Modal from "@material-ui/core/Modal";
import { colors, fontSizeBase, fontSizeLg } from "../../assets/css-consts";

export const ModalWrapper = styled(Modal)`
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`;

export const ContentWrapper = styled(Paper)`
  && {
    background-color: ${colors.white};
    box-shadow: -3px 4px 20px 4px ${alpha(colors.black, 0.15)};
    max-height: 40%;
    max-width: 35%;
    min-width: 560px;
    min-height: 280px;
    position: relative;
  }
`;

export const HeaderWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const Title = styled.h1`
  color: ${({ theme }) => theme.primaryText};
  font-weight: 500;
  font-size: 18px;
  font-size: ${fontSizeLg};
  margin-bottom: 24px;
`;

export const ExitButton = styled(IconButton)`
  && {
    color: ${colors.primary};
    align-items: center;
    margin-right: -12px;
  }
`;

export const BodyWrapper = styled(Box)`
  position: relative;
  overflow: auto;
  overflow-x: hidden;
  color: ${colors.primary};
  font-family: ${colors.primaryTextColor};
  font-size: ${fontSizeBase};
  margin: 10px 0;
`;

export const FooterWrapper = styled(Box)`
  display: flex;
  position: absolute;
  bottom: 20px;
  right: 20px;
`;

export const FadeWrapper = styled(Fade)`
  padding: 20px;
`;
