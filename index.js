import { GetItemCommand, ScanCommand, QueryCommand, PutItemCommand, DeleteItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'
import { v4 as uuidV4 } from 'uuid'

import dbbClient from './dbbClient.js'

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME

async function getProduct(productId) {
	console.log('HANDLER: GET PRODUCT')
	try {
		const params = {
			TableName: TABLE_NAME,
			Key: marshall({ id: productId })
		}

		const { Item } = await dbbClient.send(new GetItemCommand(params))
		return (Item) ? unmarshall(Item) : {}
	}
	catch (e) {
		console.error(e)
		throw e
	}
}

async function getAllProducts() {
	console.log('HANDLER: GET ALL PRODUCTS')
	try {
		const params = { TableName: TABLE_NAME }
		const { Items } = await dbbClient.send(new ScanCommand(params))
		return (Items) ? Items.map((item) => unmarshall(item)) : {}
	}
	catch (e) {
		console.error(e)
		throw e
	}
}

async function getProductsByCategory(productId, queryStringParameters) {
	console.log('HANDLER: GET PRODUCTS BY CATEGORY')
	try {
		const { category } = queryStringParameters
		const params = {
			TableName: TABLE_NAME,
			KeyConditionExpression: 'id = :productId',
			FilterExpression: 'contains (category, :category)',
			ExpressionAttributeValues: {
				':productId': { S: productId },
				':category': { S: category }
			}
		}

		const { Items } = await dbbClient.send(new QueryCommand(params))
		return Items.map((item) => unmarshall(item))
	}
	catch (e) {
		console.error(e)
		throw e
	}
}

async function createProduct(event) {
	console.log('HANDLER: CREATE PRODUCT')
	try {
		const requestBody = {
			...JSON.parse(event.body),
			id: uuidV4()
		}

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

async function updateProduct(productId, productBody) {
	console.log('HANDLER: UPDATE PRODUCT')

	try {
		const requestBody = JSON.parse(productBody)
		const bodyKeys = Object.keys(requestBody)

		const params = {
			TableName: TABLE_NAME,
			Key: marshall({ id: productId }),
			UpdateExpress: `SET ${bodyKeys.map((_, index) => `#key${index} = :value${index}`)}`,
			ExpressionAttributeNames: bodyKeys.reduce((acc, key, index) => ({
				...acc,
				[`#key${index}`]: key
			}), {}),
			ExpressionAttributeValues: marshall(requestBody.reduce((acc, key, index) => ({
				...acc,
				[`:value${index}`]: requestBody[key]
			}), {}))
		}

		return dbbClient.send(new UpdateItemCommand(params))
	}
	catch (e) {
		console.error(e)
		throw e
	}
}

async function deleteProduct(productId) {
	console.log('HANDLER: DELETE PRODUCT')
	try {
		const params = {
			TableName: TABLE_NAME,
			Key: marshall({ id: productId })
		}

		return dbbClient.send(new DeleteItemCommand(params))
	}
	catch (e) {
		console.error(e)
		throw e
	}
}

export const handler = async function handler(event) {
	console.log(`REQUEST: ${JSON.stringify(event, undefined, 2)}`)
	let responseBody

	try {
		switch (event.httpMethod) {
		case 'GET':
			if (event.queryStringParameters) {
				responseBody = await getProductsByCategory(event.pathParameters.id, event.queryStringParameters)
			}
			if (event.pathParameters) {
				responseBody = await getProduct(event.pathParameters.id)
			}
			else {
				responseBody = await getAllProducts()
			}
			break
		case 'POST':
			responseBody = await createProduct(event)
			break
		case 'PUT':
			responseBody = await updateProduct(event.pathParameters.id, event.body)
			break
		case 'DELETE':
			responseBody = await deleteProduct(event.pathParameters.id)
			break
		default:
			throw new Error(`UNSUPPORTED ROUTE METHOD: ${event.httpMethod}`)
		}

		return {
			statusCode: 200,
			body: JSON.stringify({
				message: `SUCCESSFULLY FINISHED OPERATION: ${event.httpMethod}`,
				data: responseBody
			})
		}
	}
	catch (e) {
		console.error(e)
		return {
			statusCode: 500,
			body: JSON.stringify({
				message: `OPERATION FAILED: ${event.httpMethod}`,
				errorMessage: e.message,
				errorStack: e.stack
			})
		}
	}
}
