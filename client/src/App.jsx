/* eslint-disable react/prop-types */
import React from "react"
import { observer } from "mobx-react"
import { observable, runInAction } from "mobx"
import "./App.css"

window.addEventListener("keydown", function(event) {
    runInAction(() => {
        if (event.key == "ArrowLeft") {
            stateData.isPlayerRecording[0] = true
        } else if (event.key == "ArrowDown") {
            stateData.isPlayerRecording[1] = true
        } else if (event.key == "ArrowRight") {
            stateData.isPlayerRecording[2] = true
        } else if (event.key == "ArrowUp") {
            onDeleteLastEvent()
        } else {
            for (let key in allInputData) {
                let inputData = allInputData[key]
                if (inputData.button == event.key.toLocaleLowerCase()) {
                    onRecord(inputData)
                    break
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

function onRecord(inputData) {
    for (let [i, isRecording] of stateData.isPlayerRecording.entries()) {
        if (isRecording) {
            recordedData.raw.push({
                playerIndex: i,
                inputData: inputData
            })
        }
    }
}

function onDeleteLastEvent() {
    recordedData.raw.pop()
}

const allInputData = {
    clockThrow: {
        button: "a",
        name: "Clock Throw"
    },
    counterThrow: {
        button: "s",
        name: "Counter Throw"
    },
    catch: {
        button: "f",
        name: "Catch"
    },
    pull: {
        button: "q",
        name: "Pull"
    },
    pass: {
        button: "w",
        name: "Pass"
    },
    spin1: {
        button: "1",
        name: "Single Spin"
    },
    spin2: {
        button: "2",
        name: "Double Spin"
    },
    spin3: {
        button: "3",
        name: "Triple Spin"
    },
    move: {
        button: " ",
        name: "Move"
    },
    drop: {
        button: "d",
        name: "Drop"
    }
}

let stateData = observable({
    isPlayerRecording: [false, false, false],
    isUD: false,
    playerData: ["Festi", "Colombari"]
})

const ButtonElement = observer(class ButtonElement extends React.Component {
    constructor(props) {
        super(props)

        this.inputData = props.inputData
    }

    render() {
        return (
            <div>
                <button>{`${this.inputData.button.toUpperCase()} - ${this.inputData.name}`}</button>
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
            elements.push(<ButtonElement key={key} inputData={inputData} />)
        }

        return elements
    }

    render() {
        let className = stateData.isPlayerRecording[this.props.playerIndex] ? "playerElement highlight" : "playerElement"
        return (
            <div className={className}>
                <h3>{stateData.playerData[this.props.playerIndex]}</h3>
                {this.getButtonElements()}
            </div>
        )
    }
})

const App = observer(class App extends React.Component {
    constructor() {
        super()
    }

    getRecordingOutput() {
        let events = []
        for (let [i, data] of recordedData.raw.slice().reverse().entries()) {
            events.push(
                <div key={i} className="eventEntryContainer">
                    <div className="number">{recordedData.raw.length - i}</div>
                    <div className="name">{stateData.playerData[data.playerIndex]}</div>
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

    render() {
        return (
            <div className="topContainer">
                <h2>Stats Helper</h2>
                <div className="playerContainer">
                    {this.getPlayerElements()}
                </div>
                <div>
                    {this.getRecordingOutput()}
                </div>
            </div>
        )
    }
})

export default App
