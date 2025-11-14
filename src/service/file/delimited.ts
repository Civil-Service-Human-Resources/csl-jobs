// eslint-disable-next-line @typescript-eslint/ban-types
import ObjectsToCsv from 'objects-to-csv'

export const objsToCsv = async (objects: any[]): Promise<string> => {
  const csv = new ObjectsToCsv(objects)
  return await csv.toString(true)
}

export const objsToDelimited = async (objects: any[], delimiter: string = ','): Promise<string> => {
  // If no data then return
  if (objects === null || objects.length === 0) return ''

  // For comma delimiter, use the library directly for performance and quoting
  if (delimiter === ',') {
    return await objsToCsv(objects)
  }

  // For other delimiters, manually generate delimited text
  const headers = Object.keys(objects[0])
  const lines: string[] = []

  // Add header row
  lines.push(headers.join(delimiter))

  // Add data rows
  for (const obj of objects) {
    const row = headers.map(header => {
      let value = obj[header] ?? ''
      if (typeof value === 'string') {
        // Escape quotes by doubling them
        value = value.replace(/"/g, '""')
        // Wrap in quotes if contains special characters or delimiters
        if (new RegExp(`[${delimiter}\n"]`).test(value)) {
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          value = `"${value}"`
        }
      }
      return value
    })
    lines.push(row.join(delimiter))
  }

  return lines.join('\n')
}
