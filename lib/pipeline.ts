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
    .addOns(new blueprints.ClusterAutoScalerAddOn, new blueprints.AwsLoadBalancerControllerAddOn())
    .teams(new TeamPlatform(account), new TeamApplication('developers',account));
  
    const repoUrl = 'https://github.com/acastillo5690/capstone-project-apps';

    const bootstrapRepo : blueprints.ApplicationRepository = {
        repoUrl,
        targetRevision: 'project',
    }

    const stagingBootstrapArgo = new blueprints.ArgoCDAddOn({
        bootstrapRepo: {
            ...bootstrapRepo,
            path: 'staging'
        },
    });
    const productionBootstrapArgo = new blueprints.ArgoCDAddOn({
        bootstrapRepo: {
            ...bootstrapRepo,
            path: 'production'
        },
    });
  
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
          { id: "staging", stackBuilder: blueprint.clone('us-west-2').addOns(stagingBootstrapArgo)},
          { id: "production", stackBuilder: blueprint.clone('us-east-1').addOns(productionBootstrapArgo)}
        ]
      })
      
      .build(scope, id+'-stack', props);
  }
}
