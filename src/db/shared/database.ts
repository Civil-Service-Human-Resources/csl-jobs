import type { IOrganisationDomain } from '../../service/orgDomains/model/IOrganisationDomain'
import { fetchRows } from '../connection'
import type { IAnonymousCourseRecord, ICourseCompletion, IOrganisation, ISkillsLearnerRecord } from './model'
import type { CustomDate } from '../../service/date/CustomDate'
import log from 'log'

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
    DATE_FORMAT(cr.last_updated, "%Y-%m-%d %T") as last_updated,
    cr.is_required as is_required,
    g.code as grade_code,
    g.name as grade_name
  from learner_record.course_record cr
  inner join identity.identity i on cr.user_id = i.uid
  inner join csrs.identity csrs_id on cr.user_id = csrs_id.uid
  inner join csrs.civil_servant cs on csrs_id.id = cs.identity_id
  join csrs.profession p on cs.profession_id = p.id
  left join csrs.grade g on cs.grade_id = g.id
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
          g.name as grade,
          p.name as profession,
          IF(cr.state = 'COMPLETED', 'COMPLETED', 'IN_PROGRESS') as state,
          cr.last_updated as last_updated
      from learner_record.course_record cr
               inner join csrs.identity csrs_id on cr.user_id = csrs_id.uid
               inner join csrs.civil_servant cs on csrs_id.id = cs.identity_id
               join csrs.profession p on cs.profession_id = p.id
               left join csrs.grade g on cs.grade_id = g.id
               join csrs.organisational_unit ou on cs.organisational_unit_id = ou.id
               inner join learner_record.module_record mr on cr.user_id = mr.user_id and cr.course_id = mr.course_id
          and cr.last_updated between ? and ?
          and cr.course_id in (?)
      group by cr.user_id, cr.course_id
      order by last_updated desc, user_id, course_id;`
}

const getSkillsCompletedLearnerRecordsSQL = (): string => {
  return `select
    'Create' as type,
    i.email as emailAddress,
    '' as cei,
    lr.resource_id as contentId,
    case
        when min(lre.event_timestamp) is not null then 100
        else 0
        end as progress,
    case
        when min(lre.event_timestamp) is not null then "True"
        else "False"
        end as isCompleted,
    '' as result,
    coalesce(
        case
            when min(lre.event_timestamp) is not null
                then cast(greatest(timestampdiff(second, lr.created_timestamp, min(lre.event_timestamp)), 0) as char)
            end, '') as timeSpent,
    coalesce(date_format(lr.created_timestamp, '%Y-%m-%d'), '') as enrollmentDate,
    coalesce(date_format(min(lre.event_timestamp), '%Y-%m-%d'), '') as completionDate
  from learner_record.learner_records lr
      left join learner_record.learner_record_events lre on lre.learner_record_id = lr.id and lre.learner_record_event_type = 4
      join identity.identity i on i.uid = lr.learner_id
  where i.email in (?)
    and lre.event_timestamp is not null
  group by i.email, lr.resource_id
  order by type, i.email, lr.created_timestamp, lre.event_timestamp;`
}

const getSkillsDeltaCompletedLearnerRecordsSQL = (): string => {
  return `select
    'Create' as type,
    i.email as emailAddress,
    '' as cei,
    lr.resource_id as contentId,
    case
        when min(lre.event_timestamp) is not null then 100
        else 0
        end as progress,
    case
        when min(lre.event_timestamp) is not null then "True"
        else "False"
        end as isCompleted,
    '' as result,
    coalesce(
        case
            when min(lre.event_timestamp) is not null
                then cast(greatest(timestampdiff(second, lr.created_timestamp, min(lre.event_timestamp)), 0) as char)
            end, '') as timeSpent,
    coalesce(date_format(lr.created_timestamp, '%Y-%m-%d'), '') as enrollmentDate,
    coalesce(date_format(min(lre.event_timestamp), '%Y-%m-%d'), '') as completionDate
  from learner_record.learner_records lr
      join learner_record.learner_record_events lre on lre.learner_record_id = lr.id and lre.learner_record_event_type = 4 and lre.event_timestamp > ?
      join identity.identity i on i.uid = lr.learner_id
  where i.email in (?) and lre.event_timestamp is not null
  group by i.email, lr.resource_id
  order by type, i.email, lr.created_timestamp, lre.event_timestamp;`
}

export const getSkillsCompletedLearnerRecords = async (emailIds: string[], lastRunTimestamp: CustomDate | undefined): Promise<ISkillsLearnerRecord[]> => {
  const SQL = getSkillsCompletedLearnerRecordsSQL()
  const SQL_DELTA = getSkillsDeltaCompletedLearnerRecordsSQL()
  if (lastRunTimestamp === undefined) {
    log.info('lastRunTimestamp is not available therefore running initial full load')
    return await fetchRows<ISkillsLearnerRecord>(SQL, [emailIds])
  }
  log.info(`lastRunTimestamp: '${lastRunTimestamp.toISOString()}' is available therefore running delta load`)
  return await fetchRows<ISkillsLearnerRecord>(SQL_DELTA, [lastRunTimestamp.toISOString(), emailIds])
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
