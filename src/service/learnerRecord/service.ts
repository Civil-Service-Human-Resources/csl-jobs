import { getAnonymousCourseRecords } from '../../db/shared/database'
import { getOrganisationsWithFullNames } from '../csrs/service'
import { getClientsideDayJS } from '../../util/dateUtil'
import { type IAnonymousCourseRecord } from '../../db/shared/model'

export async function getFormattedCourseRecords (courseIds: string[]): Promise<IAnonymousCourseRecord[]> {
  const data = await getAnonymousCourseRecords(courseIds)
  const orgsNameMap = await getOrganisationsWithFullNames()
  for (const row of data) {
    const fullOrgName = orgsNameMap.get(parseInt(row.organisation_id))
    if (fullOrgName !== undefined) {
      row.organisation = fullOrgName
    }
    // The MySQL server can't calculate timezone unfortunately, so we'll do it here
    row.last_updated = getClientsideDayJS(row.last_updated).format('YYYY-MM-DDTHH:mm:ss')
  }
  return data
}
