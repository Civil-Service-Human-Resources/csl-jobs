import { app, InvocationContext, Timer } from "@azure/functions";
import config from "../config";
import { runJob } from "../service/job/jobService";
import { JobType } from "../service/job/JobType";

const { jobs: { scaleDownAppServices: { cron, runOnStartup } } } = config

export async function scaleDownAppServices(myTimer: Timer, context: InvocationContext): Promise<void>{
  await runJob(JobType.SCALE_DOWN_APP_SERVICES)
}

app.timer('scaleDownAppServices', {
  schedule: cron,
  handler: scaleDownAppServices,
  runOnStartup
})