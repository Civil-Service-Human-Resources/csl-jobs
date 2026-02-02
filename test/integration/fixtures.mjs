import { DockerComposeEnvironment, Wait } from 'testcontainers'
import path from 'path'

const composeFilePath = path.join(import.meta.dirname, '../../docker')
const composeFile = 'docker-compose.yml'

let composeEnv

export async function mochaGlobalSetup () {
  try {
    console.log('Attempting to build testcontainers')
    composeEnv = await new DockerComposeEnvironment(composeFilePath, composeFile)
      .withWaitStrategy('ftps_test_server', Wait.forLogMessage('passwd: password for testuser changed by root'))
      .withStartupTimeout(20000)
      .withNoRecreate().up()
  } catch (e) {
    console.error('Could not create testContainers')
    console.error(e)
    throw e
  }
}

export async function mochaGlobalTeardown () {
  if (composeEnv !== undefined) {
    console.log('Attempting to teardown testcontainers')
    await composeEnv.down()
  }
}
