#!/usr/bin/env node
import "source-map-support/register"
import * as cdk from "aws-cdk-lib"
import { SfnSampleStack } from "../lib/sfn-sample-stack"

const app = new cdk.App()
new SfnSampleStack(app, "SfnSampleStack", {})
