import type { IDomain } from '../orgDomains/model/IDomain'
import ExcelJS from 'exceljs'

export const createExcelSpreadsheetfromOrgDomainData = (domainData: IDomain[]): ExcelJS.Workbook => {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Organisation domains')
  addHeadersToSheet(sheet)

  let cursor = 2

  domainData.forEach((domain: IDomain) => {
    const domainRowStart = cursor
    sheet.getCell(`A${cursor}`).value = domain.domain

    sheet.getCell(`A${cursor}`).alignment = {
      vertical: 'top'
    }

    domain.organisations.forEach((organisation) => {
      sheet.getCell(`B${cursor}`).value = organisation.organisation_name
      sheet.getCell(`C${cursor}`).value = organisation.usages
      sheet.getCell(`D${cursor}`).value = organisation.last_logged_in.toLocaleString('en-GB')
      cursor++
    })

    if (domain.organisations.length > 1) {
      sheet.mergeCells(`A${domainRowStart}:A${cursor - 1}`)
    }
  })

  return workbook
}

const addHeadersToSheet = (sheet: ExcelJS.Worksheet): void => {
  const headers = {
    A: 'Domain',
    B: 'Organisation',
    C: 'Usages',
    D: 'Last logged in'
  }

  Object.keys(headers).forEach((headerKey) => {
    sheet.getCell(`${headerKey}:1`).value = headers[headerKey]
  })
}
