import { fetchRows } from '../connection'
import { type ICourseCompletion } from './model'

const getCourseCompletionSQL = (): string => {
  return `select
    cr.user_id as user_id,
    cs.full_name as full_name,
    i.email as email,
    ou.name as organisation,
    ou.id as organisationId,
    ou.code as organisationCode,
    p.name as profession,
    cr.course_id as course_id,
    cr.course_title as course_title,
    cr.state as state,
    cr.last_updated as last_updated,
    cr.is_required as is_required
  from learner_record.course_record cr
  inner join identity.identity i on cr.user_id = i.uid
  inner join csrs.identity csrs_id on cr.user_id = csrs_id.uid
  inner join csrs.civil_servant cs on csrs_id.id = cs.identity_id
  join csrs.profession p on cs.profession_id = p.id
  join csrs.organisational_unit ou on cs.organisational_unit_id = ou.id
  where state = 'COMPLETED'
  and last_updated between ? and ?
  order by last_updated desc, user_id, course_id;`
}

export const getCompletedCourseRecords = async (fromDate: Date, toDate: Date): Promise<ICourseCompletion[]> => {
  const SQL = getCourseCompletionSQL()
  return await fetchRows<ICourseCompletion>(SQL, [fromDate.toISOString(), toDate.toISOString()])
}
