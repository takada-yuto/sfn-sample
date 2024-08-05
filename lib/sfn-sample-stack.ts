import * as cdk from "aws-cdk-lib"
import {
  CloudFrontWebDistribution,
  OriginAccessIdentity,
} from "aws-cdk-lib/aws-cloudfront"
import { AnyPrincipal, Effect, PolicyStatement } from "aws-cdk-lib/aws-iam"
import { BlockPublicAccess, Bucket } from "aws-cdk-lib/aws-s3"
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment"
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

    const cloudfrontUrl = `https://${distribution.distributionDomainName}`

    // CloudFrontディストリビューションのドメイン名を出力
    new cdk.CfnOutput(this, "cloudfrontUrl", {
      value: cloudfrontUrl,
    })

    new BucketDeployment(this, "SfnSampleFrontendBucketDeployment", {
      sources: [Source.asset("frontend/out")],
      destinationBucket: frontendBucket,
      distribution: distribution,
      distributionPaths: ["/*"],
    })
  }
}
