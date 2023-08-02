// eslint-disable-next-line @typescript-eslint/ban-types
export const objsToCsv = (objects: any[]): string => {
  const csv = Object.keys(objects[0]).join(',') + '\n'
  return csv + objects.map(c => {
    return Object.values(c).map(c => {
      const value = c as string
      return `"${value}"`
    })
  }).join('\n')
}
