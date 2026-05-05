import { ImportSource } from "@/lib/level2/types"

export type ParsedImportRow = {
  [key: string]: string
}

export type ImportColumnMapping = {
  date: string
  description: string
  amount: string
  type?: string
  account?: string
  card?: string
}

function normalizeLine(line: string) {
  return line.replace(/\r/g, "").trim()
}

function splitCsvLine(line: string, delimiter: string) {
  const cells: string[] = []
  let current = ""
  let insideQuotes = false
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    const next = line[index + 1]
    if (char === '"') {
      if (insideQuotes && next === '"') {
        current += '"'
        index += 1
      } else {
        insideQuotes = !insideQuotes
      }
      continue
    }
    if (char === delimiter && !insideQuotes) {
      cells.push(current.trim())
      current = ""
      continue
    }
    current += char
  }
  cells.push(current.trim())
  return cells
}

function detectDelimiter(header: string) {
  return header.includes(";") ? ";" : ","
}

export function parseCsv(content: string): ParsedImportRow[] {
  const lines = content.split("\n").map(normalizeLine).filter(Boolean)
  if (!lines.length) return []
  const delimiter = detectDelimiter(lines[0])
  const headers = splitCsvLine(lines[0], delimiter).map((header) => header.trim())
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line, delimiter)
    const row: ParsedImportRow = {}
    headers.forEach((header, index) => {
      row[header] = values[index] || ""
    })
    return row
  })
}

export function parseOfx(content: string): ParsedImportRow[] {
  const rows: ParsedImportRow[] = []
  const normalized = content.replace(/\r/g, "")
  const matches = normalized.match(/<STMTTRN>[\s\S]*?<\/STMTTRN>/gi) || []
  for (const block of matches) {
    const get = (tag: string) => {
      const match = block.match(new RegExp(`<${tag}>([^<\n\r]+)`, "i"))
      return match?.[1]?.trim() || ""
    }
    rows.push({
      data: get("DTPOSTED").slice(0, 8).replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3"),
      descricao: get("MEMO") || get("NAME"),
      valor: get("TRNAMT"),
      tipo: get("TRNTYPE"),
    })
  }
  return rows
}

export function parseImportFile(content: string, fileType: ImportSource) {
  if (fileType === "ofx") return parseOfx(content)
  return parseCsv(content)
}

export function mapRow(row: ParsedImportRow, mapping: ImportColumnMapping) {
  return {
    raw_date: row[mapping.date] || "",
    raw_description: row[mapping.description] || "",
    raw_amount: row[mapping.amount] || "",
    raw_type: mapping.type ? row[mapping.type] || "" : "",
    raw_account: mapping.account ? row[mapping.account] || "" : "",
    raw_card: mapping.card ? row[mapping.card] || "" : "",
  }
}
