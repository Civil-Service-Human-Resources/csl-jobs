// eslint-disable-next-line @typescript-eslint/ban-types
import ObjectsToCsv from 'objects-to-csv'

export const objsToCsv = async (objects: any[]): Promise<string> => {
  const csv = new ObjectsToCsv(objects)
  return await csv.toString(true)
}
