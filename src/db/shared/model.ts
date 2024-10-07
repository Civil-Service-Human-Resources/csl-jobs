import { type RowDataPacket } from 'mysql2'

export interface ICourseCompletion extends RowDataPacket {
  user_id: string
  full_name: string
  email: string
  organisation: string
  organisation_id: string
  organisation_code: string
  grade_code: string
  grade_name: string
  profession: string
  course_id: string
  course_title: string
  state: string
  last_updated: string
  is_required: boolean
}

export interface IAnonymousCourseRecord extends RowDataPacket {
  id: string
  user_id: string
  course_id: string
  course_title: string
  organisation: string
  organisation_id: string
  organisation_code: string
  grade_code: string
  grade_name: string
  profession: string
  state: string
  last_updated: string
}

export interface IOrganisation extends RowDataPacket {
  id: number
  name: string
  parent_id: number | null
}
