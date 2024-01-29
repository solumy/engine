import type { AppError } from './app/AppError'
import type { FeatureError } from './feature/FeatureError'
import type { PageError } from './page/PageError'
import type { RoleError } from './role/RoleError'
import type { SpecError } from './spec/SpecError'
import type { TableError } from './table/TableError'

export type EngineErrorCode = 'UNKNOWN_SCHEMA_ERROR'

export type EngineError = AppError | FeatureError | SpecError | RoleError | PageError | TableError
