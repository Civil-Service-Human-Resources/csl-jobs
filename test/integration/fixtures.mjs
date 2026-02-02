import { GenericContainer } from 'testcontainers'
import path from 'path'

const dockerFilepath = path.join(import.meta.dirname, '../../docker')

let azuriteContainer
let ftpsContainer

export async function mochaGlobalSetup () {
  try {
    console.log('Attempting to build Azurite container')
    azuriteContainer = await new GenericContainer('mcr.microsoft.com/azure-storage/azurite')
      .withExposedPorts({ container: 10000, host: 10000 }, { container: 10001, host: 10001 }, { container: 10002, host: 10002 }).start()

    const ftpsDockerfile = `${dockerFilepath}/ftps`
    console.log(`Attempting to build FTPS container from Dockerfile at ${ftpsDockerfile}`)
    ftpsContainer = (await GenericContainer
      .fromDockerfile(ftpsDockerfile).build())
      .withExposedPorts({ container: 21, host: 21 })
      .start()
  } catch (e) {
    console.error('Could not create testContainers')
    console.error(e)
    throw e
  }
}

export async function mochaGlobalTeardown () {
  if (azuriteContainer !== undefined) {
    console.log('Attempting to teardown azurite container')
    await azuriteContainer.down()
  }
  if (ftpsContainer !== undefined) {
    console.log('Attempting to teardown ftps container')
    await ftpsContainer.down()
  }
}
