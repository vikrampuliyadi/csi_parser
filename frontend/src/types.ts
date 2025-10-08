export type Position = { start: number; end: number }

export type ParseResultItem = {
  keyword: string
  page: number
  section_hint?: string
  spec_section?: string
  snippet: string
  context_before: string
  context_after: string
  context_window: string
  confidence: number
  match_type: 'exact' | 'regex' | 'fuzzy'
  positions: Position[]
  proximity_window?: number
}

export type DocumentMeta = {
  filename: string
  num_pages: number
  parse_time_ms: number
}

export type ParseResponse = {
  document: DocumentMeta
  results: ParseResultItem[]
  meta: Record<string, any>
}
