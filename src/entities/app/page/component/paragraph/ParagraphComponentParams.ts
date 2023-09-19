import * as t from 'io-ts'

export const ParagraphSize = t.union([t.literal('small'), t.literal('medium'), t.literal('large')])

export type ParagraphSize = t.TypeOf<typeof ParagraphSize>

export const ParagraphComponentParams = t.intersection([
  t.type({
    type: t.literal('paragraph'),
    text: t.string,
  }),
  t.partial({
    size: ParagraphSize,
  }),
])

export type ParagraphComponentParams = t.TypeOf<typeof ParagraphComponentParams>
