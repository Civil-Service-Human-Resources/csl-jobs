import { type RowDataPacket } from 'mysql2'

export interface ICourseCompletion extends RowDataPacket {
  user_id: string
  full_name: string
  email: string
  organisation: string
  organisation_id: string
  organisation_code: string
  profession: string
  course_id: string
  course_title: string
  state: string
  last_updated: string
  is_required: boolean
}

export interface IAnonymousCourseRecord extends RowDataPacket {
  organisation: string
  organisation_id: string
  organisation_code: string
  grade: string
  profession: string
  state: string
}
