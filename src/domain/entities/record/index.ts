import { Persisted, type Data as PersistedData } from './Persisted'
import { ToCreate, type Data as ToCreateData, type Params as ToCreateParams } from './ToCreate'
import { ToUpdate, type Data as ToUpdateData } from './ToUpdate'

export type RecordParams = ToCreateParams

export class Record {
  constructor(private params: RecordParams) {}

  create = (data: ToCreateData) => {
    return new ToCreate(data, this.params)
  }

  update = (data: ToUpdateData) => {
    return new ToUpdate(data)
  }

  persist = (data: PersistedData) => {
    return new Persisted(data)
  }
}
