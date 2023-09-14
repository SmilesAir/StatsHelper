import React from "react"
import { observer } from "mobx-react"
import "./App.css"

const PlayerElement = observer(class PlayerElement extends React.Component {
    constructor() {
        super()
    }

    render() {
        return (
            <div>
                <div>Player Name</div>
            </div>
        )
    }
})

const App = observer(class App extends React.Component {
    constructor() {
        super()
    }

    render() {
        return (
            <div className="topContainer">
                <h2>Stats Helper</h2>
                <div className="playerContainer">
                    <PlayerElement />
                    <PlayerElement />
                    <PlayerElement />
                </div>
            </div>
        )
    }
})

export default App
