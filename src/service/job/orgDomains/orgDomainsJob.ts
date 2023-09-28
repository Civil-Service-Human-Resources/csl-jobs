import { readFileSync } from "fs";
import { getAllDomains } from "../../../db/identity/database";
import { getOrganisationDomains } from "../../../db/shared/database";
import { UploadResult, uploadFile } from "../../azure/storage/blob/service";
import { JobsFile } from "../../file/models";
import { IDomain } from "../../orgDomains/model/IDomain";
import { IOrganisationDomain } from "../../orgDomains/model/IOrganisationDomain";
import { Job } from "../Job";
import { JobResult } from "../jobService";
import ExcelJS from "exceljs";
import log from 'log'
import { sendOrgDomainsNotification } from "../../notification/govUKNotify/govUkNotify";
import { createExcelSpreadsheetfromOrgDomainData } from "../../file/excel";
import { groupOrganisationsByDomain } from "../../orgDomains/orgDomainGrouping";

export class OrgDomainsJob extends Job{
  protected async runJob(): Promise<JobResult> {
    log.info("Running organisation domains job...")

    log.info("Getting domain and organisation data from the database...")
    let data = await getDataFromDatabase()
    log.info(`Found ${data.allDomains.length} unique domains.`)
    log.info(`Found ${data.organisationDomains} organisation/domain pairs.`)

    let organisationsGroupedByDomains: IDomain[] = groupOrganisationsByDomain(data.allDomains, data.organisationDomains)
    log.info("Organisations have been grouped by domain")

    log.info("Creating spreadsheet...")
    const filePath = getFilePath()
    await createExcelSpreadsheetfromOrgDomainData(organisationsGroupedByDomains, filePath.fullPath)
    log.info("Spreadsheet created.")

    log.info("Uploading file ")
    let uploadResult: UploadResult = await uploadFile('orgdomain-files', new JobsFile(filePath.fileName, readFileSync(filePath.fullPath)))

    await sendOrgDomainsNotification("Organisation domains", new Date(), uploadResult)

    return {
      text: `Organisation domains file with name ${filePath.fileName} has been successfully created.`
    }
    
  }
  public getName(): string {
    return "Organisation Domains File"
  }
  
}

const getDataFromDatabase = async () => {
  return {
    allDomains: await getAllDomains(),
    organisationDomains: await getOrganisationDomains()
  }
}

const getFilePath = () => {
  const location = "/tmp/"
  const now = new Date()

  const day: string = now.getDate() < 10 ? `0${now.getDate()}` : now.getDate().toString()
  const month: string = (now.getMonth()+1) < 10 ? `0${(now.getMonth()+1)}` : (now.getMonth()+1).toString()
  const year: string = now.getFullYear().toString()

  const dateSuffix = `${day}${month}${year}`

  const fileName: string = `orgDomains-${dateSuffix}.xlsx`
  
  return {
    location,
    fileName,
    fullPath: `${location}${fileName}`
  }
}