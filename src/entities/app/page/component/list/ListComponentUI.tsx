import React, { Fragment } from 'react'
import { BaseComponentUIProps } from '../base/BaseComponentUI'
import { UIService } from '@entities/services/ui/UIService'
import { Record } from '@entities/services/database/record/Record'
import { Column } from './ListComponentParams'

export interface ListRowComponentUIProps {
  record: Record
  columns: Column[]
  ui: UIService
  getCellByFormat: (column: Column, record: Record) => JSX.Element
}

export function ListRowComponentUI({
  record,
  ui,
  columns,
  getCellByFormat,
}: ListRowComponentUIProps) {
  const { Row, Cell } = ui.getList()
  return (
    <Row id={record.id}>
      {columns.map((column: Column, index: number) => {
        return <Cell key={index}>{getCellByFormat(column, record)}</Cell>
      })}
    </Row>
  )
}

export interface GroupType {
  name: string
  label: string
  records: Record[]
}

export interface ListComponentUIProps {
  records: Record[]
  columns: Column[]
  groups: GroupType[]
  ui: UIService
  getCellByFormat: (column: Column, record: Record) => JSX.Element
}

export function ListComponentUI({
  columns,
  records,
  groups,
  ui,
  getCellByFormat,
}: ListComponentUIProps) {
  const { Container, Header, Rows, Group, HeaderColumn } = ui.getList()
  return (
    <Container>
      <Header>
        {columns.map((column: Column, index: number) => {
          return <HeaderColumn label={column.label} key={index} />
        })}
      </Header>
      <Rows>
        {groups.length > 0
          ? groups.map((group) => (
              <Fragment key={group.name}>
                <Group colSpan={columns.length} label={group.label} />
                {group.records.map((record) => (
                  <ListRowComponentUI
                    key={record.id}
                    record={record}
                    columns={columns}
                    ui={ui}
                    getCellByFormat={getCellByFormat}
                  />
                ))}
              </Fragment>
            ))
          : records.map((record: Record) => (
              <ListRowComponentUI
                key={record.id}
                record={record}
                columns={columns}
                ui={ui}
                getCellByFormat={getCellByFormat}
              />
            ))}
      </Rows>
    </Container>
  )
}

export interface ListUI {
  Container: React.FC<BaseComponentUIProps>
  Header: React.FC<BaseComponentUIProps>
  HeaderColumn: React.FC<ListUIHeaderColumnProps>
  Group: React.FC<ListUIGroupProps>
  Rows: React.FC<BaseComponentUIProps>
  Row: React.FC<ListUIRowProps>
  Cell: React.FC<BaseComponentUIProps>
  TextCell: React.FC<ListUITextCellProps>
  ButtonCell: React.FC<ListUIButtonCellProps>
  LinkCell: React.FC<ListUILinkCellProps>
  CurrencyCell: React.FC<ListUICurrencyFieldCellProps>
}

export interface ListUIHeaderColumnProps {
  label: string
}

export interface ListUIGroupProps {
  label: string
  colSpan: number
}

export interface ListUIRowProps extends BaseComponentUIProps {
  id: string
}

export interface ListUITextCellProps {
  value: string
}

export interface ListUICurrencyFieldCellProps {
  value: number
  currency: '€'
}

export interface ListUIButtonCellProps {
  label: string
  onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void
}

export interface ListUILinkCellProps {
  label: string
}