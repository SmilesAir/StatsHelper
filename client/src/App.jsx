/* eslint-disable react/prop-types */
import React, { useEffect } from "react"
import { observer } from "mobx-react"
import { observable, runInAction } from "mobx"
import "./App.css"

if (import.meta.hot) {
    import.meta.hot.on(
      "vite:beforeUpdate",
      () => console.clear()
    );
}

const eventKey = "77427e49-792c-4a8e-b0e1-7577a47dd36e"
const queryString = window.location.search
const urlParams = new URLSearchParams(queryString)
const mode = urlParams.get("mode")

const eventDataUrl = "https://xf4cu1wy10.execute-api.us-west-2.amazonaws.com/production/getEventData/"
const playerDataUrl = "https://4wnda3jb78.execute-api.us-west-2.amazonaws.com/production/getAllPlayers"
//const awsPath = import.meta.env.DEV ? "https://vxen9xoj97.execute-api.us-west-2.amazonaws.com/development/" : "https://tjl4cgwhm4.execute-api.us-west-2.amazonaws.com/production/"
const awsPath = "https://vxen9xoj97.execute-api.us-west-2.amazonaws.com/development/"

function postData(url, data) {
    return fetch(url, {
        method: "POST",
        mode: "cors",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    }).then((response) => {
        return response.json()
    }).catch((error) => {
        console.error(error)
    })
}

function getData(url) {
    return fetch(url, {
        method: "GET",
        mode: "cors",
        headers: {
            "Content-Type": "application/json"
        }
    }).then((response) => {
        return response.json()
    }).catch((error) => {
        console.error(error)
    })
}

let playerData = undefined
getData(playerDataUrl).then((data) => {
    playerData = data
}).then(() => {
    getData(`${eventDataUrl}${eventKey}`).then((data) => {
        runInAction(() => {
            stateData.eventData = data.eventData

            fetchTeamData()
        })
    })
})

function fetchPoolData() {
    if (stateData.eventData !== undefined) {
        let poolData = stateData.eventData.eventData.poolMap[stateData.eventData.eventState.activePoolKey]
        if (poolData !== undefined) {
            for (let [i, team] of poolData.teamData.entries()) {
                let playersKeys = team.players.join("_")
                getData(`${awsPath}getStatsData/${eventKey}/poolKey/${stateData.eventData.eventState.activePoolKey}/playersKeys/${playersKeys}`).then((resp) => {
                    runInAction(() => {
                        if (resp.success) {
                            stateData.poolRecordedData[i] = resp.statsData.data.dataArray || []
                        } else {
                            stateData.poolRecordedData[i] = []
                        }
                    })
                })
            }
        }
    }
}

function fetchTeamData() {
    let teamData = getTeamData()
    if (teamData !== undefined) {
        stateData.playerData = teamData.players

        return getData(`${awsPath}getStatsData/${eventKey}/poolKey/${stateData.eventData.eventState.activePoolKey}/playersKeys/${getPlayersKeys()}`).then((resp) => {
            if (resp.success) {
                recordedData.raw = resp.statsData.data.dataArray || []
            } else {
                recordedData.raw = []
            }
        })
    }
}

const maxUpdateCount = 30 * 3600 * 12
let updateCount = 0
if (mode === "team" || mode === "pool") {
    let updateHandle = setInterval(() => {
        ++updateCount
        if (updateCount > maxUpdateCount) {
            clearInterval(updateHandle)
        }
        getData(`${eventDataUrl}${eventKey}`).then((data) => {
            runInAction(() => {
                stateData.eventData = data.eventData

                if (mode === "team") {
                    fetchTeamData()
                } else {
                    fetchPoolData()
                }
            })
        })
    }, 2000)
} else {
    let updateHandle = setInterval(() => {
        ++updateCount
        if (updateCount > maxUpdateCount) {
            clearInterval(updateHandle)
        }
        getData(`${eventDataUrl}${eventKey}`).then((data) => {
            let prevTeams = getPlayersKeys()
            stateData.eventData = data.eventData
            if (prevTeams != getPlayersKeys()) {
                fetchTeamData()
            }
        })
    }, 2000)
}

function getTeamData() {
    if (stateData.eventData !== undefined) {
        let poolData = stateData.eventData.eventData.poolMap[stateData.eventData.eventState.activePoolKey]
        let teamIndex = stateData.eventData.controllerState.selectedTeamIndex
        if (poolData !== undefined && teamIndex !== undefined) {
            return poolData.teamData[teamIndex]
        }
    }
}

function getPlayersKeys() {
    let teamData = getTeamData()
    if (teamData !== undefined) {
        return teamData.players.join("_")
    }
}

window.addEventListener("keydown", function(event) {
    runInAction(() => {
        let isInstant = stateData.inputMode === "instant"
        if (!isInstant && event.key == "ArrowLeft") {
            stateData.isPlayerRecording[0] = true
        } else if (!isInstant && event.key == "ArrowDown") {
            stateData.isPlayerRecording[1] = true
        } else if (!isInstant && event.key == "ArrowRight") {
            stateData.isPlayerRecording[2] = true
        } else if (event.key == "ArrowUp" || (isInstant && event.key === " ")) {
            event.preventDefault()
            onDeleteLastEvent()
        } else {
            for (let key in allInputData) {
                let inputData = allInputData[key]
                if (stateData.inputMode === "instant") {
                    for (let [playerIndex, buttonArray] of inputData.instantButton.entries()) {
                        for (let button of buttonArray) {
                            if (button === event.key.toLocaleLowerCase()) {
                                onRecord(inputData, playerIndex)
                                break
                            }
                        }
                    }
                } else {
                    if (inputData.button === event.key.toLocaleLowerCase()) {
                        onRecord(inputData)
                        break
                    }
                }
            }
        }
    })
})

window.addEventListener("keyup", function(event) {
    runInAction(() => {
        if (event.key == "ArrowLeft") {
            stateData.isPlayerRecording[0] = false
        } else if (event.key == "ArrowDown") {
            stateData.isPlayerRecording[1] = false
        } else if (event.key == "ArrowRight") {
            stateData.isPlayerRecording[2] = false
        }
    })
})

let recordedData = observable({
    raw: []
})

function uploadStatsData(data) {
    postData(`${awsPath}setStatsData/${eventKey}/poolKey/${stateData.eventData.eventState.activePoolKey}/playersKeys/${getPlayersKeys()}`, {
            dataArray: data
        }).catch((error) => {
            console.error(error)
        })
}

function onRecord(inputData, playerIndex) {
    if (playerIndex !== undefined) {
        if (playerIndex >= 0 && playerIndex < stateData.playerData.length) {
            recordedData.raw.push({
                    playerIndex: playerIndex,
                    inputData: inputData
                })
            }

            uploadStatsData(recordedData.raw)
    } else {
        for (let [i, isRecording] of stateData.isPlayerRecording.entries()) {
            if (isRecording) {
                recordedData.raw.push({
                    playerIndex: i,
                    inputData: inputData
                })

                uploadStatsData(recordedData.raw)
            }
        }
    }
}

function onDeleteLastEvent() {
    recordedData.raw.pop()

    uploadStatsData(recordedData.raw)
}

const allInputData = {
    throw: {
        button: "a",
        instantButton: [["a"], ["j"], ["q", "u"]],
        name: "Throw"
    },
    catch: {
        button: "s",
        instantButton: [["s"], ["k"], ["w", "i"]],
        name: "Catch"
    },
    drop: {
        button: "d",
        instantButton: [["d"], ["l"], ["e", "o"]],
        name: "Drop"
    },
    move: {
        button: "f",
        instantButton: [["f"], [";"], ["r", "p"]],
        name: "Move"
    }
}

let stateData = observable({
    isPlayerRecording: [false, false, false],
    isUD: false,
    playerData: [],
    poolRecordedData: [],
    eventData: undefined,
    inputMode: "instant"
})

stateData.inputMode = urlParams.get("inputMode") || "instant" // instant, arrow

const ButtonElement = observer(class ButtonElement extends React.Component {
    constructor(props) {
        super(props)

        this.inputData = props.inputData
    }

    render() {
        let buttonName = "N/A"
        if (stateData.inputMode === "instant") {
            if (this.props.playerIndex < this.inputData.instantButton.length) {
                buttonName = this.inputData.instantButton[this.props.playerIndex].map((button) => button.toUpperCase()).join(", ")
            } else {
                buttonName = "N/A"
            }
        } else {
            buttonName = this.inputData.button.toUpperCase()
        }
        return (
            <div>
                <button>{`${buttonName} - ${this.inputData.name}`}</button>
            </div>
        )
    }
})

const PlayerElement = observer(class PlayerElement extends React.Component {
    constructor() {
        super()
    }

    getButtonElements() {
        let elements = []
        for (let key in allInputData) {
            let inputData = allInputData[key]
            elements.push(<ButtonElement key={key} inputData={inputData} playerIndex={this.props.playerIndex} />)
        }

        return elements
    }

    render() {
        if (playerData === undefined || playerData.players.length === 0) {
            return null
        }

        let className = stateData.isPlayerRecording[this.props.playerIndex] ? "playerElement highlight" : "playerElement"
        return (
            <div className={className}>
                <h3>{getPlayerName(this.props.playerIndex)}</h3>
                {this.getButtonElements()}
            </div>
        )
    }
})

function getPlayerName(index) {
    if (playerData === undefined) {
        return "No Name Data"
    }

    return getPlayerNameFromKey(stateData.playerData[index])
}

function getPlayerNameFromKey(key) {
    if (playerData === undefined) {
        return "No Name Data"
    }

    let player = playerData.players[key]
    if (player === undefined) {
        return "Missing Name"
    }

    return player.firstName + " " + player.lastName
}

const App = observer(class App extends React.Component {
    constructor() {
        super()
    }

    getRecordingOutput() {
        if (playerData === undefined || playerData.players.length === 0) {
            return null
        }

        let events = []
        for (let [i, data] of recordedData.raw.slice().reverse().entries()) {
            events.push(
                <div key={i} className="eventEntryContainer">
                    <div className="number">{recordedData.raw.length - i}</div>
                    <div className="name">{getPlayerName(data.playerIndex)}</div>
                    <div className="move">{data.inputData.name}</div>
                </div>
            )
        }

        return (
            <div className="eventContainer">
                {events}
            </div>
        )
    }

    getPlayerElements() {
        return stateData.playerData.map((data, i) => {
            return <PlayerElement key={i} playerIndex={i}/>
        })
    }

    getNormalized(a, b, reverse) {
        if (a + b === 0) {
            return "0"
        }

        let num = a / (a + b)
        num = reverse ? 1 - num : num

        return num.toFixed(2).toString().replace("0.", ".")
    }

    getMultiPlayerStatString(counts, playerCount) {
        return counts.slice(0, playerCount).join("/")
    }

    getMultiPlayerCatchPercString(catchCounts, dropCounts, playerCount) {
        let numbers = []
        for (let i = 0; i < playerCount; ++i) {
            let catchCount = catchCounts[i]
            console.log(i, catchCount, dropCounts[i])
            numbers.push(Math.round(this.getNormalized(catchCount, dropCounts[i]) * 100))
        }

        return this.getMultiPlayerStatString(numbers, playerCount)
    }

    getStatsString(dataArray, isPerPlayer) {
        if (dataArray !== undefined && dataArray.length > 0) {
            let totalThrowCount = 0
            let totalCatchCount = 0
            let totalDropCount = 0
            let totalMoveCount = 0
            let throwCounts = [0, 0, 0]
            let catchCounts = [0, 0, 0]
            let dropCounts = [0, 0, 0]
            let moveCounts = [0, 0, 0]
            for (let e of dataArray) {
                switch (e.inputData.name) {
                    case allInputData.throw.name:
                        ++totalThrowCount
                        ++throwCounts[e.playerIndex]

                        ++totalMoveCount
                        ++moveCounts[e.playerIndex]
                        break
                    case allInputData.catch.name:
                        ++totalCatchCount
                        ++catchCounts[e.playerIndex]

                        ++totalMoveCount
                        ++moveCounts[e.playerIndex]
                        break
                    case allInputData.drop.name:
                        ++totalDropCount
                        ++dropCounts[e.playerIndex]
                        break
                    case allInputData.move.name:
                        ++totalMoveCount
                        ++moveCounts[e.playerIndex]
                        break
                }
            }

            if (isPerPlayer === true) {
                let playerCount = getTeamData().players.length
                return `Throws ${this.getMultiPlayerStatString(throwCounts, playerCount)} | ` +
                    `Catch % ${this.getMultiPlayerCatchPercString(catchCounts, dropCounts, playerCount)} | ` +
                    `Moves ${this.getMultiPlayerStatString(moveCounts, playerCount)}`
            } else {
                return `Throws: ${totalThrowCount} | ` +
                    `Catch %: ${this.getNormalized(totalThrowCount, totalThrowCount - (totalThrowCount - totalDropCount)) * 100} | ` +
                    `Moves: ${totalMoveCount}`
            }
        }

        return "No Stats Data"
    }

    getTeamElement() {
        console.log(JSON.stringify(recordedData.raw))
        return (
                <div className="displayBase teamContainer">
                    {this.getStatsString(recordedData.raw)}
                </div>
            )
    }

    getPoolElement() {
        if (stateData.eventData !== undefined) {
            let poolData = stateData.eventData.eventData.poolMap[stateData.eventData.eventState.activePoolKey]
            if (poolData !== undefined) {
                if (stateData.poolRecordedData.length === poolData.teamData.length) {
                    let teamElements = []
                    for (let i = 0; i < poolData.teamData.length; ++i) {
                        let team = poolData.teamData[i]
                        let dataArray = stateData.poolRecordedData[i]
                        let namesArray = team.players.map((playerKey) => getPlayerNameFromKey(playerKey))
                        let namesString = namesArray.join(" - ")

                        teamElements.push(
                            <div>
                                <div className="name">{namesString}</div>
                                <div className="statsString">{this.getStatsString(dataArray, true)}</div>
                            </div>
                        )
                    }

                    let poolParts = stateData.eventData.eventState.activePoolKey.split("|")
                    let poolString = `${poolParts[2]} ${poolParts[3]}`
                    if (poolParts[3] !== "Finals") {
                        poolString += " " + poolParts[4]
                    }

                    return (
                        <div className="displayBase poolContainer">
                            <div className="title">
                                {`${stateData.eventData.eventName} - ${poolString}`}
                            </div>
                            {teamElements}
                        </div>
                    )
                }
            }
        }

        return <div>No Pool Data</div>
    }

    toggleInputMode() {
        if (stateData.inputMode === "instant") {
            stateData.inputMode = "arrow"
        } else {
            stateData.inputMode = "instant"
        }
    }

    render() {
        if (mode === "team") {
            return this.getTeamElement()
        } else if (mode === "pool") {
            return this.getPoolElement()
        } else {
            return (
                <div className="topContainer">
                    <h2>Stats Helper</h2>
                    <button onClick={() => this.toggleInputMode()}>{stateData.inputMode}</button>
                    <div className="playerContainer">
                        {this.getPlayerElements()}
                    </div>
                    <div>
                        {this.getRecordingOutput()}
                    </div>
                </div>
            )
        }
    }
})

export default App
