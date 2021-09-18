import React, { useState } from 'react';
import logo from './logo.svg';
import { Principal } from './dtos/principal';
import { GameSettings } from "./dtos/game-settings";
import {BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import {NavbarComponent} from './components/NavbarComponent';
import LoginComponent from "./components/LoginComponent";
import HomeComponent from "./components/HomeComponent";
import SplashComponent from "./components/SplashComponent";
import RegisterComponent from "./components/RegisterComponent"
import CustomGameComponent from './components/CustomGameComponent';
import ManageCollectionComponent from './components/ManageCollectionComponent';
import DiscoverCollectionsComponent from './components/DiscoverCollectionsComponent';
import ViewCollectionComponent from './components/ViewCollectionComponent';
import JoinGameComponent from './components/JoinGameComponent';
import GameComponent from './components/GameComponent';
import DashboardComponent from './components/DashboardComponent';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { Collections } from './dtos/collection';
import { GameState } from './dtos/game-state';
import { createTheme, ThemeProvider } from '@material-ui/core';

const theme = createTheme({
  palette: {
    primary: {
      main: '#5f2568'
    }
  }
})

const styles = {
      backgroundImage: "url(/splash.jpg)",
      backgroundPosition: 'center',
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      width: '100vw',
      height: '125vh'
};

function App() {

  const [authUser, setAuthUser] = useState(undefined as Principal | undefined)
  const [collection , setCollection] = useState(undefined as  [] | undefined)
  const [gameSettings, setGameSettings] = useState(undefined as  GameSettings | undefined)
  const [currCollection , setCurrCollection] = useState(undefined as  Collections | undefined)
  const [selectedCollection , setSelectCollection] = useState(undefined as  Collections | undefined)
  const [currentGame, setCurrentGame] = useState(undefined as GameState | undefined)
  const [currentGameId, setCurrentGameId] = useState('')

  return (
    <>
    <div style ={styles}>
    <ThemeProvider theme = {theme}>
      <Router>
        <NavbarComponent currentUser={authUser} setCurrentUser={setAuthUser}/>
        <Switch>
            <Route exact path="/" render={() => <HomeComponent currentUser={authUser} /> } />
            <Route path="/home" render={() => <HomeComponent currentUser={authUser} /> } />
            <Route path="/splash" render={() => <SplashComponent /> } />
            <Route path="/login" render={() => <LoginComponent currentUser={authUser} setCurrentUser={setAuthUser} /> } />
            <Route path="/register" render={() => <RegisterComponent currentUser={authUser} setCurrentUser={setAuthUser} /> } />
            <Route path="/custom-game" render={() => <CustomGameComponent currentUser={authUser} currentGameId={currentGameId} setCurrentGameId={setCurrentGameId} selectedCollection={selectedCollection} setSelectedCollection={setSelectCollection} currentCollections={collection} setCurrentCollection={setCollection} currentGameSettings_={gameSettings} setCurrentGameSettings_={setGameSettings}/> } />
            <Route path="/manage-collections" render={() => <ManageCollectionComponent currentUser={authUser} setCurrCollection={setCurrCollection}  /> } />
            <Route path="/discover" render={() => <DiscoverCollectionsComponent currentUser={authUser} setCurrCollection={setCurrCollection}  /> } />
            <Route path="/view-collection" render={() => <ViewCollectionComponent currentUser={authUser} collection={currCollection} setCollection={setCurrCollection}/> } />
            <Route path="/join-game" render={() => <JoinGameComponent currentUser={authUser} currentGame={currentGame} setCurrentGame={setCurrentGame} currentGameId={currentGameId} setCurrentGameId={setCurrentGameId}/> } />
            <Route path="/game" render={() => <GameComponent currentUser={authUser} currentGameId={currentGameId} />} />
            <Route path="/dashboard" render={() => <DashboardComponent currentUser={authUser}/> } />
        </Switch>
       </Router>
      </ThemeProvider>
      </div>
    </>
  );
}

export default App;