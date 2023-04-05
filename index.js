import { GetItemCommand, ScanCommand, PutItemCommand } from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'
import { dbbClient } from '../dbbClient'

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME

async function getProduct(productId) {
	console.log('HANDLER: GET PRODUCT')
	try {
		const params = {
			TableName: TABLE_NAME,
			key: marshall({ id: productId })
		}

		const { Item } = await dbbClient.send(new GetItemCommand(params))
		return (Item) ? unmarshall(Item) : {}
	}
	catch (e) {
		console.error(e)
		throw e
	}
}

export default async function getAllProducts() {
	console.log('HANDLER: GET ALL PRODUCTS')
	try {
		params = { TableName: TABLE_NAME }
		const { Items } = await dbbClient.send(new ScanCommand(params))
		return (Items) ? Items.map((item) => unmarshall(item)) : {}
	}
	catch (e) {
		console.error(e)
		throw e
	}
}

async function createProduct(event) {
	console.log('HANDLER: CREATE PRODUCT')
	try {
		const requestBody = JSON.parse(event.body)
		const params = {
			TableName: TABLE_NAME,
			Item: marshall(requestBody || {})
		}
		return dbbClient.send(new PutItemCommand(params))
	}
	catch (e) {
		console.error(e)
		throw e
	}
}


export default async function handler(event) {
	console.log(`REQUEST: ${JSON.stringify(event, undefined, 2)}`)
	let responseBody

	switch (event.httpMethod) {
		case 'GET':
			if (!!event.pathParameters) {
				responseBody = await getProduct(event.pathParameters.id)
			}
			else {
				responseBody = await getAllProducts()
			}
			break
		case 'POST':
			responseBody = await createProduct(event)
			break
		default:
			throw new Error(`UNSUPPORTED ROUTE METHOD: ${event.httpMethod}`)
	}

	return {
		statusCode: 200,
		headers: { 'Content-Type': 'text/plain' },
		body: responseBody
	}
}