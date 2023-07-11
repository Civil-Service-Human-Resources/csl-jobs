# CSL-Jobs

CSL Jobs is a Typescript-based Azure Functions application that supports BAU background tasks on the CSL platform. It is primarily intended to support the move away from (and eventual decommisioning of) Jenkins jobs, with scope to add more jobs as the platform requires. These jobs can be anything related to the maintenance/autonomy of the platform.

Read more about Azure Functions here: https://learn.microsoft.com/en-us/azure/azure-functions/functions-overview?pivots=programming-language-javascript

## Requirements

To run this project locally, you'll require:
- Node 18
- Visual Studio Code
- Azurite
- VSCode Azure Functions extension > 1.10.4
- Azure Function Core Tools > v4.0.5095

## Running

### Azurite

To run Azurite locally, run the `Azurite start` command in the command pallette in VSCode.

### Debug

The app can be debugged using the built-in debugger in VSCode.