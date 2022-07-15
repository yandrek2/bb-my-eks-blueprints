import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as blueprints from '@aws-quickstart/eks-blueprints';

import { TeamPlatform, TeamApplication } from '../teams';

export default class PipelineConstruct extends Construct {
  constructor(scope: Construct, id: string, props?: cdk.StackProps){
    super(scope,id)

    const account = props?.env?.account!;
    const region = props?.env?.region!;

    const blueprint = blueprints.EksBlueprint.builder()
    .account(account)
    .region(region)
    .addOns()
    .teams(new TeamPlatform(account), new TeamApplication('Devs',account));
  
    blueprints.CodePipelineStack.builder()
      .name("eks-blueprints-workshop-pipeline")
      .owner("acastillo5690")
      .repository({
          repoUrl: 'my-eks-blueprints',
          credentialsSecretName: 'github-token-1',
          targetRevision: 'main'
      })
      
      .wave({
        id: "envs",
        stages: [
          { id: "staging", stackBuilder: blueprint.clone('us-west-2')},
          { id: "production", stackBuilder: blueprint.clone('us-east-1')}
        ]
      })
      
      .build(scope, id+'-stack', props);
  }
}
