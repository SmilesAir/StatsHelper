const AWS = require("aws-sdk")
let docClient = new AWS.DynamoDB.DocumentClient()

const Common = require("./common.js")

function makeKey(eventKey, poolKey, playersKeys) {
    return eventKey + "+" + poolKey + "+" + playersKeys
}

module.exports.setStatsData = (e, c, cb) => { Common.handler(e, c, cb, async (event, context) => {
    let eventKey = decodeURIComponent(event.pathParameters.eventKey)
    let poolKey = decodeURIComponent(event.pathParameters.poolKey)
    let playersKeys = decodeURIComponent(event.pathParameters.playersKeys)
    let data = JSON.parse(event.body) || {}

    let statsData = {
        key: makeKey(eventKey, poolKey, playersKeys),
        eventKey: eventKey,
        poolKey: poolKey,
        playersKeys: playersKeys,
        createdAt: Date.now(),
        data: data
    }

    let putParams = {
        TableName : process.env.STATS_TABLE,
        Item: statsData
    }
    await docClient.put(putParams).promise().catch((error) => {
        throw error
    })

    return {
        success: true
    }
})}

module.exports.getStatsData = (e, c, cb) => { Common.handler(e, c, cb, async (event, context) => {
    let eventKey = decodeURIComponent(event.pathParameters.eventKey)
    let poolKey = decodeURIComponent(event.pathParameters.poolKey)
    let playersKeys = decodeURIComponent(event.pathParameters.playersKeys)

    let key = makeKey(eventKey, poolKey, playersKeys)
    let getParams = {
        TableName : process.env.STATS_TABLE,
        Key: {
            key: key
        }
    }
    let statsData = await docClient.get(getParams).promise().then((response) => {
        return response.Item
    }).catch((error) => {
        throw error
    })

    if (statsData === undefined) {
        return {
            success: false
        }
    }

    return {
        success: true,
        statsData: statsData
    }
})}
