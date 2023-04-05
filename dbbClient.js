import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
const region = 'use-east-2'
const dbbClient = new DynamoDBClient({ region })

export default dbbClient