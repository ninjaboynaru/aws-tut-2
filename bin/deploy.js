require('dotenv-safe').config()
const path = require('path')
const fs = require('node:fs')
const { setTimeout } = require('timers/promises')
const { execSync } = require('node:child_process')
const { LambdaClient, UpdateFunctionCodeCommand, GetFunctionCommand } = require('@aws-sdk/client-lambda')
const axios = require('axios')

const FUNCTION_NAME = process.env.LAMBDA_FUNCTION_NAME

const FUNCTION_UPDATE_STATUS = {
	IN_PROGRESS: 'InProgress',
	SUCCESS: 'Successful',
	FAILED: 'Failed'
}

const projectDirectory = path.resolve(__dirname, '../')
const functionDirectory = path.join(projectDirectory, '/function/')
const outputDirectory = path.join(projectDirectory, '/output')
const outputZipPath = path.join(outputDirectory, '/function.zip')

const client = new LambdaClient()

function installNodeModules() {
	console.log('INSTALLING NODE MODULES')
	execSync('npm install', { cwd: functionDirectory })
}

function setupOutputDirectory() {
	console.log('SETTING UP OUTPUT DIRECTORY')
	const outputDirectoryExists = fs.existsSync(outputDirectory)
	const outputIsDirectory = outputDirectoryExists ? fs.statSync(outputDirectory).isDirectory() : false

	if (!outputIsDirectory) {
		console.log('CREATING OUTPUT FOLDER')
		fs.mkdirSync(outputDirectory)
	}

	if (fs.existsSync(outputZipPath)) {
		console.log('REMOVING EXISTING OUTPUT FILES')
		fs.unlinkSync(outputZipPath)
	}
}

function zipFunction() {
	execSync(`zip -r ${path.relative(functionDirectory, outputZipPath)} ./*`, { cwd: functionDirectory })
}

async function uploadFunction() {
	console.log('UPLOADING LAMBDA FUNCTION')

	const updateCommand = new UpdateFunctionCodeCommand({
		FunctionName: FUNCTION_NAME,
		ZipFile: fs.readFileSync(outputZipPath)
	})

	await client.send(updateCommand)
}

async function functionSuccessStatus() {
	console.log('WAITING FOR FUNCTION STATUS TO BE "SUCCESS"')

	const getFunctionCommand = new GetFunctionCommand({
		FunctionName: FUNCTION_NAME
	})

	const checkDelay = 100
	const maxChecks = 20

	function consoleDivider() {
		console.log('<<---------------------------------------------------------------------------------->>')
	}

	consoleDivider()
	for (let i = 0; i < maxChecks; i += 1) {
		console.log(`STATUS CHECK ${i + 1}`)
		const functionInfo = await client.send(getFunctionCommand)	// eslint-disable-line no-await-in-loop
		const updateStatus = functionInfo.Configuration.LastUpdateStatus

		if (updateStatus === FUNCTION_UPDATE_STATUS.FAILED) {
			consoleDivider()
			throw new Error('FUNCTION UPDATE FAILED.\nPLEASE CHECK THE AWS WEB CONSOLE FOR MORE INFO')
		}
		else if (updateStatus === FUNCTION_UPDATE_STATUS.SUCCESS) {
			consoleDivider()
			console.log('FUNCTION UPDATE SUCCEEDED\nFUNCTION IS READY TO USE')
			return
		}

		console.log(`FUNCTION NOT READY. WILL CHECK AGAIN IN ${checkDelay} milliseconds`)
		await setTimeout(checkDelay)	// eslint-disable-line no-await-in-loop
	}

	consoleDivider()
	throw new Error('FUNCTION TOOK TOO LONG TO BECOME READY\n')
}

async function apiGatewayHealthCheck() {
	const gatewayUrl = process.env.API_GATEWAY_URL
	console.log('PERFORMING API GATEWAY HEALTH CHECK (PING REQUEST)')
	console.log(`SENDING PING REQUEST TO ${gatewayUrl}`)
	try {
		const pingResponse = await axios.get(`${gatewayUrl}/ping`)
		const responseData = pingResponse.data?.data || {}
		if (!responseData.ping || !responseData.statusVerificationCode) {
			throw new Error('HEALTH CHECK RESPONSE WAS NOT AS EXPECTED')
		}
		else {
			console.log('HEALTH CHECK SUCCESS')
		}
	}
	catch (e) {
		console.log(e)
		throw new Error('HEALTH CHECK REQUEST FAILED')
	}
}

async function main() {
	console.log('DEPLOYING LAMBDA FUNCTION')

	try {
		installNodeModules()
		setupOutputDirectory()
		zipFunction()
		await uploadFunction()
		await functionSuccessStatus()
		await apiGatewayHealthCheck()
		console.log('DEPLOY COMPLETED')
	}
	catch (e) {
		console.log('\n\nDEPLOY FAILED')
		throw e
	}
}

main()
