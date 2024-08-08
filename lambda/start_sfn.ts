import { APIGatewayProxyHandler } from "aws-lambda"
import * as AWS from "aws-sdk"

const stepfunctions = new AWS.StepFunctions()

export const handler: APIGatewayProxyHandler = async (event) => {
  const { name, body } = JSON.parse(event.body || "{}")

  const params = {
    stateMachineArn: process.env.STATE_MACHINE_ARN!,
    input: JSON.stringify({ name, body }),
  }

  try {
    await stepfunctions.startExecution(params).promise()
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Execution started successfully" }),
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Failed to start execution", error }),
    }
  }
}
