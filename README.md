# CSL-Jobs

CSL Jobs is a Typescript-based Azure Functions application that supports BAU background tasks on the CSL platform. It is primarily intended to support the move away from (and eventual decommisioning of) Jenkins jobs, with scope to add more jobs as the platform requires. These jobs can be anything related to the maintenance/autonomy of the platform.

Read more about Azure Functions here: https://learn.microsoft.com/en-us/azure/azure-functions/functions-overview?pivots=programming-language-javascript

## Requirements

To run this project locally, you'll require:
- Node 18

Additionally, to run the Azure Functions local runtime:
- Visual Studio Code
- Azurite
- VSCode Azure Functions extension > 1.10.4
- Azure Function Core Tools > v4.0.5095

## Running

### Azure Functions runtime

#### Azurite

To run Azurite locally, run the `Azurite start` command in the command pallette in VSCode.

#### Debug

The app can be debugged using the built-in debugger in VSCode after all of the relevant extensions have been installed.

> IMPORTANT: Cron jobs will not run locally on startup unless a specific environment variable is set (per job)

### Local script

The jobs within the application can also be run locally using the `start.ts` script.

Use the npm run debug-local command along with the name of the Function you’d like to test. For example, to run the clearDuplicateTokens function locally:

`npm run debug-local -- --functionName clearDuplicateTokens`

This command will invoke the ts-node package to directly run the start.ts typescript file.