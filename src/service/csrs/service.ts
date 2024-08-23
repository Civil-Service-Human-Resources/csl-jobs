import { getOrganisationsWithIds } from '../../db/shared/database'
import { type IOrganisation } from '../../db/shared/model'

export const getOrganisationsWithFullNames = async (): Promise<Map<number, string>> => {
  const orgs = await getOrganisationsWithIds()
  const orgMap: Map<number, IOrganisation> = new Map<number, IOrganisation>(orgs.map(o => {
    return [o.id, o]
  }))
  const result = new Map<number, string>()
  let currentParentId: number | null
  for (const org of orgs) {
    let currentName = org.name
    currentParentId = org.parent_id
    while (currentParentId !== null) {
      const parent = orgMap.get(currentParentId)
      if (parent !== undefined) {
        currentName = `${parent.name} | ${currentName}`
        currentParentId = parent.parent_id
      } else {
        currentParentId = null
      }
    }
    result.set(org.id, currentName)
  }
  return result
}
