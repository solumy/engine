import { Action } from '@domain/entities/automation/Action'
import { ActionDto } from '../dtos/ActionDto'
import { UpdateRecordActionMapper } from './actions/UpdateRecordActionMapper'
import { LogActionMapper } from './actions/LogActionMapper'
import { UpdateRecordAction } from '@domain/entities/automation/actions/UpdateRecordAction'
import { LogAction } from '@domain/entities/automation/actions/LogAction'
import { ILogSpi } from '@domain/spi/ILogSpi'
import { Table } from '@domain/entities/table/Table'

export interface ActionMapperSpis {
  log: ILogSpi
}

export class ActionMapper {
  static toEntity(actionDto: ActionDto, tables: Table[], spis: ActionMapperSpis): Action {
    const { log } = spis
    const { type } = actionDto
    if (type === 'update_record') {
      return UpdateRecordActionMapper.toEntity(actionDto, tables)
    }
    if (type === 'log') {
      return LogActionMapper.toEntity(actionDto, log)
    }
    throw new Error(`Invalid action type ${type}`)
  }

  static toDto(action: Action): ActionDto {
    if (action instanceof UpdateRecordAction) {
      return UpdateRecordActionMapper.toDto(action)
    }
    if (action instanceof LogAction) {
      return LogActionMapper.toDto(action)
    }
    throw new Error(`Invalid action instance ${action}`)
  }

  static toEntities(actionDtos: ActionDto[], tables: Table[], spis: ActionMapperSpis): Action[] {
    return actionDtos.map((actionDto) => this.toEntity(actionDto, tables, spis))
  }

  static toDtos(actions: Action[]): ActionDto[] {
    return actions.map((action) => this.toDto(action))
  }
}