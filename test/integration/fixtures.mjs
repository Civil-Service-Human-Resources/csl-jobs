import { GenericContainer, Wait } from 'testcontainers'
import path from 'path'

const testContainers = JSON.parse(process.env.TESTCONTAINERS ?? 'true') === true
const dockerFilepath = path.join(import.meta.dirname, '../../docker')
const ftpsDockerfile = `${dockerFilepath}/ftps`

const containers = [{
  name: 'azurite',
  build: async () => {
    return await new GenericContainer('mcr.microsoft.com/azure-storage/azurite')
      .withExposedPorts({ container: 10000, host: 10000 }, { container: 10001, host: 10001 }, { container: 10002, host: 10002 })
      .withWaitStrategy(Wait.forLogMessage('Azurite Table service is successfully listening at http://0.0.0.0:10002')).start()
  }
},
{
  name: `ftps (${ftpsDockerfile})`,
  build: async () => {
    return await (await GenericContainer
      .fromDockerfile(ftpsDockerfile).build())
      .withExposedPorts({ container: 21, host: 21 }, { container: 21000, host: 21000 })
      .withWaitStrategy(Wait.forLogMessage('passwd: password for testuser changed by root'))
      .start()
  }
}]

async function setupContainers () {
  try {
    for (const container of containers) {
      console.log(`Attempting to build ${container.name} container`)
      const containerObj = await container.build()
      console.log(`Built ${container.name} container`)
      container.obj = containerObj
    }
  } catch (e) {
    console.error('Could not create testContainers')
    console.error(e)
    await stopContainers()
    throw e
  }
}

async function stopContainers () {
  const containerToStop = containers.filter(c => c.obj !== undefined)
  console.log(`Stopping ${containerToStop.length} containers`)
  for (const container of containerToStop) {
    await container.obj.stop()
  }
}

export async function mochaGlobalSetup () {
  if (testContainers) {
    console.log('Using testcontainers')
    await setupContainers()
  } else {
    console.log('TESTCONTAINERS was false so not using test containers')
  }
}

export async function mochaGlobalTeardown () {
  if (testContainers) {
    await stopContainers()
  }
}
