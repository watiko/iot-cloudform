import cloudform, { Fn, IAM, IoT } from 'cloudform';
import DataType from 'cloudform-types/types/dataTypes';
import Role from 'cloudform-types/types/iam/role';

export default cloudform({
  Description: 'aws-iot',
  Parameters: {
    CertificateARN: {
      Type: DataType.String,
    },
  },
  Resources: {
    MyThing: new IoT.Thing({}),
    MyPolicy: new IoT.Policy({
      PolicyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: 'iot:Connect',
            Resource: ['*'],
          },
          {
            Effect: 'Allow',
            Action: 'iot:Publish',
            Resource: [
              Fn.Join('', [
                'arn:aws:iot:ap-northeast-1:',
                Fn.Ref('AWS::AccountId'),
                ':topic/tokyo/7f/*',
              ]),
            ],
          },
        ],
      },
    }),
    MyThingAttachment: new IoT.ThingPrincipalAttachment({
      ThingName: Fn.Ref('MyThing'),
      Principal: Fn.Ref('CertificateARN'),
    }),
    MyPolicyAttachment: new IoT.PolicyPrincipalAttachment({
      PolicyName: Fn.Ref('MyPolicy'),
      Principal: Fn.Ref('CertificateARN'),
    }),
    CloudWatchIamRole: new IAM.Role({
      RoleName: 'watiko-iot-cloud-watch',
      AssumeRolePolicyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'iot.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      },
      Policies: [
        new Role.Policy({
          PolicyName: 'cloudwatch-metrics-write',
          PolicyDocument: {
            Version: '2012-10-17',
            Statement: {
              Effect: 'Allow',
              Action: 'cloudwatch:PutMetricData',
              Resource: ['*'],
            },
          },
        }),
      ],
    }),
    MyTopicRuleCo2: new IoT.TopicRule({
      TopicRulePayload: {
        AwsIotSqlVersion: '2016-03-23',
        Sql: "SELECT ppm FROM 'tokyo/7f/co2'",
        Actions: [
          {
            CloudwatchMetric: new IoT.TopicRule.CloudwatchMetricAction({
              MetricName: 'co2',
              MetricNamespace: 'AWS/IoT/tokyo/7F',
              MetricUnit: 'None',
              MetricValue: '$ppm',
              RoleArn: Fn.GetAtt('CloudWatchIamRole', 'Arn'),
            }),
          },
        ],
        RuleDisabled: false,
      },
    }),
    MyTopicRuleDHT11: new IoT.TopicRule({
      TopicRulePayload: {
        AwsIotSqlVersion: '2016-03-23',
        Sql: "SELECT temperature, humidity FROM 'tokyo/7f/dht11'",
        Actions: [
          {
            CloudwatchMetric: new IoT.TopicRule.CloudwatchMetricAction({
              MetricName: 'temperature',
              MetricNamespace: 'AWS/IoT/tokyo/7F',
              MetricUnit: 'None',
              MetricValue: '$temperature',
              RoleArn: Fn.GetAtt('CloudWatchIamRole', 'Arn'),
            }),
          },
          {
            CloudwatchMetric: new IoT.TopicRule.CloudwatchMetricAction({
              MetricName: 'humidity',
              MetricNamespace: 'AWS/IoT/tokyo/7F',
              MetricUnit: 'None',
              MetricValue: '$humidity',
              RoleArn: Fn.GetAtt('CloudWatchIamRole', 'Arn'),
            }),
          },
        ],
        RuleDisabled: false,
      },
    }),
  },
});
