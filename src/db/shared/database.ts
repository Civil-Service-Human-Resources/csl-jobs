import type { IOrganisationDomain } from '../../service/orgDomains/model/IOrganisationDomain'
import { fetchRows } from '../connection'
import type { IAnonymousCourseRecord, ICourseCompletion, IOrganisation } from './model'

const getCourseCompletionSQL = (): string => {
  return `select
    cr.user_id as user_id,
    cs.full_name as full_name,
    i.email as email,
    ou.name as organisation,
    ou.id as organisationId,
    ou.code as organisationCode,
    g.code as grade_code,
    g.name as grade_name,
    p.name as profession,
    cr.course_id as course_id,
    cr.course_title as course_title,
    cr.state as state,
    DATE_FORMAT(cr.last_updated, "%Y-%m-%d %T") as last_updated,
    cr.is_required as is_required
  from learner_record.course_record cr
  inner join identity.identity i on cr.user_id = i.uid
  inner join csrs.identity csrs_id on cr.user_id = csrs_id.uid
  inner join csrs.civil_servant cs on csrs_id.id = cs.identity_id
  join csrs.profession p on cs.profession_id = p.id
  join csrs.grade g on cs.grade_id = g.id
  join csrs.organisational_unit ou on cs.organisational_unit_id = ou.id
  where state = 'COMPLETED'
  and cr.last_updated between ? and ?
  order by last_updated desc, user_id, course_id;`
}

const getCourseRecordSQL = (): string => {
  return `select
    concat(cr.course_id, '-', cr.user_id) as id,
    cr.user_id as user_id,
    cr.course_id as course_id,
    cr.course_title as course_title,
    ou.name as organisation,
    ou.id as organisation_id,
    ou.code as organisation_code,
    g.code as grade_code,
    g.name as grade_name,
    p.name as profession,
    cr.state as state,
    cr.last_updated as last_updated
  from learner_record.course_record cr
  inner join csrs.identity csrs_id on cr.user_id = csrs_id.uid
  inner join csrs.civil_servant cs on csrs_id.id = cs.identity_id
  join csrs.profession p on cs.profession_id = p.id
  join csrs.grade g on cs.grade_id = g.id
  join csrs.organisational_unit ou on cs.organisational_unit_id = ou.id
  where state in ('COMPLETED', 'IN_PROGRESS')
  and cr.last_updated between ? and ?
  and cr.course_id in (?)
  order by last_updated desc, user_id, course_id;`
}

export const getCompletedCourseRecords = async (fromDate: Date, toDate: Date): Promise<ICourseCompletion[]> => {
  const SQL = getCourseCompletionSQL()
  return await fetchRows<ICourseCompletion>(SQL, [fromDate.toISOString(), toDate.toISOString()])
}

export const getAnonymousCourseRecords = async (fromDate: Date, toDate: Date, courseIds: string[]): Promise<IAnonymousCourseRecord[]> => {
  const SQL = getCourseRecordSQL()
  return await fetchRows<IAnonymousCourseRecord>(SQL, [fromDate.toISOString(), toDate.toISOString(), courseIds])
}

export const getOrganisationsWithIds = async (): Promise<IOrganisation[]> => {
  const query = `SELECT ou.name, ou.id, ou.parent_id
  FROM csrs.organisational_unit ou`
  return await fetchRows<IOrganisation>(query, [])
}

export const getOrganisationDomains = async (): Promise<IOrganisationDomain[]> => {
  const query = `SELECT 
      domain, 
      IF(parent_org_name IS NULL, organisation_name, CONCAT(organisation_name, ' | ', parent_org_name)) AS organisation_name, 
      COUNT(domain) AS usages, 
      MAX(last_logged_in) AS last_logged_in 
    FROM (
      SELECT SUBSTRING_INDEX(email,'@', -1) AS domain, csrs.organisational_unit.name AS organisation_name, parent_org_unit.name AS parent_org_name, identity.identity.last_logged_in AS last_logged_in FROM identity.identity
        JOIN csrs.identity ON csrs.identity.uid = identity.identity.uid
        JOIN csrs.civil_servant ON csrs.civil_servant.identity_id = csrs.identity.id
        JOIN csrs.organisational_unit ON csrs.organisational_unit.id = csrs.civil_servant.organisational_unit_id
        LEFT JOIN csrs.organisational_unit parent_org_unit ON parent_org_unit.id = csrs.organisational_unit.parent_id
      ) AS domains
    GROUP BY domain, organisation_name
    ORDER BY domain;`

  return await fetchRows<IOrganisationDomain>(query, [])
}
