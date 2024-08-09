import * as cdk from "aws-cdk-lib"
import {
  CloudFrontWebDistribution,
  OriginAccessIdentity,
} from "aws-cdk-lib/aws-cloudfront"
import { AnyPrincipal, Effect, PolicyStatement } from "aws-cdk-lib/aws-iam"
import { FunctionUrlAuthType, Runtime } from "aws-cdk-lib/aws-lambda"
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs"
import { BlockPublicAccess, Bucket } from "aws-cdk-lib/aws-s3"
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment"
import { DefinitionBody, StateMachine } from "aws-cdk-lib/aws-stepfunctions"
import { CallAwsService } from "aws-cdk-lib/aws-stepfunctions-tasks"
import { Construct } from "constructs"

export class SfnSampleStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const frontendBucket = new Bucket(this, "SfnSampleFrontendBucket", {
      websiteIndexDocument: "index.html",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      publicReadAccess: true,
      blockPublicAccess: BlockPublicAccess.BLOCK_ACLS,
    })

    const policyStatement = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ["s3:GetObject"],
      principals: [new AnyPrincipal()],
      resources: [frontendBucket.arnForObjects("*")],
    })
    frontendBucket.addToResourcePolicy(policyStatement)

    const sfnSampleOAI = new OriginAccessIdentity(this, "SfnSampleFrontendOAI")
    frontendBucket.grantRead(sfnSampleOAI)

    const distribution = new CloudFrontWebDistribution(
      this,
      "SfnSampleFrontendWebDestribution",
      {
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: frontendBucket,
              originAccessIdentity: sfnSampleOAI,
            },
            behaviors: [
              {
                isDefaultBehavior: true,
              },
            ],
          },
        ],
      }
    )

    const bucket = new Bucket(this, "Bucket", {
      bucketName: "kakakakakku-sandbox-stepfunctions-put-object",
    })

    const putObjectTask = new CallAwsService(this, "PutObjectTask", {
      service: "s3",
      action: "putObject",
      parameters: {
        Bucket: bucket.bucketName,
        "Key.$": `States.Format('{}/{}', $$.Execution.Name, $.name)`,
        "Body.$": "$.body",
        ContentType: "application/json",
      },
      iamResources: ["*"],
    })

    const stateMachine = new StateMachine(this, "StateMachine", {
      stateMachineName: "sandbox-cdk-stepfunctions-put-object",
      definition: putObjectTask,
    })

    const startExecutionLambda = new NodejsFunction(this, "StartSfnLambda", {
      runtime: Runtime.NODEJS_20_X,
      handler: "handler",
      entry: "lambda/start_sfn.ts",
      environment: {
        STATE_MACHINE_ARN: stateMachine.stateMachineArn,
      },
    })

    stateMachine.grantStartExecution(startExecutionLambda)

    // Lambda Function URLの設定
    const functionUrl = startExecutionLambda.addFunctionUrl({
      authType: FunctionUrlAuthType.NONE,
      cors: {
        allowedHeaders: ["*"],
        allowedOrigins: ["*"],
      },
    })

    new cdk.CfnOutput(this, "FunctionUrl", {
      value: functionUrl.url,
    })

    const cloudfrontUrl = `https://${distribution.distributionDomainName}`

    // CloudFrontディストリビューションのドメイン名を出力
    new cdk.CfnOutput(this, "cloudfrontUrl", {
      value: cloudfrontUrl,
    })

    new BucketDeployment(this, "SfnSampleFrontendBucketDeployment", {
      sources: [
        Source.asset("frontend/out"),
        Source.jsonData("env.json", {
          startSfnFunctionUrl: functionUrl.url,
        }),
      ],
      destinationBucket: frontendBucket,
      distribution: distribution,
      distributionPaths: ["/*"],
    })
  }
}
