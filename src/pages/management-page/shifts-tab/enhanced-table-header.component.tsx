/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import TableHead from "@material-ui/core/TableHead";
import React from "react";
import * as S from "./enhanced-table-header.styled";
import {
  NewShiftTemplate,
  ShiftEditComponentMode,
} from "../../../components/shifts-drawer/shift-edit-drawer.component";
import { Shift } from "../../../state/schedule-data/shifts-types/shift-types.model";

interface EnhancedTableProps {
  toggleOpen: (shift: NewShiftTemplate, mode: ShiftEditComponentMode) => void;
}

interface ShiftDataCell {
  id: keyof Shift;
  label: string;
}

const headCells: ShiftDataCell[] = [
  { id: "name", label: "Nazwa zmiany" },
  { id: "from", label: "Godziny" },
  { id: "code", label: "Skrót" },
  { id: "color", label: "Kolor" },
];

export function EnhancedTableHeaderComponent(props: EnhancedTableProps): JSX.Element {
  return (
    <TableHead>
      <S.TableRow>
        {headCells.map((headCell) => (
          <S.TableCell key={headCell.id}>{headCell.label}</S.TableCell>
        ))}
      </S.TableRow>
    </TableHead>
  );
}
