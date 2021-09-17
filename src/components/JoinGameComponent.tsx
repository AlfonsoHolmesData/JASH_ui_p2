import {useState, useEffect} from "react";
import {Principal} from "../dtos/principal";
import {Player} from "../dtos/player";
import { GameState } from "../dtos/game-state";
import {getSavedCollections} from "../remote/user-service";
import ErrorMessageComponent from "./ErrorMessageComponent";
import { Redirect , Link, withRouter, useHistory } from "react-router-dom";
import { Collections } from "../dtos/collection";
import { Alert, Card, InputGroup, Table, Button, FormControl } from "react-bootstrap";
import { makeStyles } from "@material-ui/core";

import * as firestore from 'firebase/firestore';
import { getAuth, signInWithPopup, GoogleAuthProvider, } from '@firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';

import app from '../util/Firebase';
import { act } from "react-dom/test-utils";

const db = firestore.getFirestore(app);


interface IJoinGameProps {
    currentUser: Principal | undefined;
    currentGame: GameState | undefined;
    setCurrentGame: (game: GameState | undefined) => void;
    currentGameId: string;
    setCurrentGameId: ((gameId: string) => void);
}

const useStyles = makeStyles({
    JGameContainer: {
        backgroundColor: "black",
        opacity: .94,
        justifyContent: "center",
        marginLeft: "10rem",
        marginTop: "5rem",
        paddingTop:'5em',
        paddingBottom:'5em',
        width: "75%",
        height:"75%",
        borderRadius: "8em",
        border: "white",
        overflow: "hidden",

    },
    TableStyle: {
        overflowY: "scroll",
          
    }
}) 

const buttonStyle = {
    backgroundColor: '#5f2568',
    border: '#5f2568',
    color: "gold",
    marginLeft: '1em'
  }

/**
 *  We want the JoinGameComponent to:
 *      - display a list of all currently available games, ie games that are in an open lobby and not yet started
 *          + when games are created, they are stored in our Firebase Firestore realtime database, and should be pulled from there as well
 *          + games should not be displayed if they have already started, are private, or have no more room for players
 *      - provide a button next to open games to allow users to join that game
 *      - provide an entry field to directly join a game which the user has an id for
 *      - provide a back button to return to previous screen 
 */

function JoinGameComponent(props: IJoinGameProps) {

    // Current list of games in realtime database
    let [activeGames, setActiveGames] = useState([] as GameState[]);
    let [errorMessage, setErrorMessage] = useState('');
    let [gamesRef, setGamesRef] = useState(firestore.collection(db, 'games'))
    let [gameId, setGameId] = useState('');

    let history = useHistory();
    // let [unsub, setUnsub] = useState((undefined as firestore.Unsubscribe | undefined))


    // game id = FsvUzbk9Ql4nhrEmrK1v

    useEffect(() => {
        //@ts-ignore
        let unsub;
        const retrieveCollection = () => {
            unsub = firestore.onSnapshot(gamesRef, snapshot => {
                console.log('JOIN CALLBACK');
                let games = snapshot.docChanges()
                games.forEach(async doc => {
                    // @ts-ignore
                    let _id = doc.doc.id;
                    let playersRef = firestore.collection(gamesRef, `${_id}/players`);
                    let playersArr = await getPlayers(gameId, playersRef);
                    // console.log('Returned players array', playersArr);
                    // @ts-ignore
                    let temp = doc.doc['_document']['data']['value']['mapValue']['fields'];
                    if(!_id || !temp.name || !temp.capacity || !temp.match_state || !temp.question_index || !temp.question_timer || !temp.start_time || !temp.end_time) {
                        console.log("INVALID COLLECTION IN FIREBASE", temp);
                        return;
                    }
                    let newGame : GameState = {
                        id: _id,
                        name: temp.name.stringValue,
                        capacity: temp.capacity.integerValue,
                        match_state: temp.match_state.integerValue,
                        question_index: temp.question_index,
                        question_timer: temp.question_timer,
                        start_time: temp.start_time.timestampValue,
                        end_time: temp.end_time.timestampValue,
                        host: temp.host.stringValue,
                        players: playersArr,
                        collection: temp.collection.mapValue.fields
                    }
                    console.log(newGame);
                    let gameIndex = 0;
                    switch(doc.type) {
                        // Handle case of new game being created
                        case 'added':
                            console.log('A game was added');
                            setActiveGames(prevGames => [...prevGames, newGame])
                            break;
                        // Handle case of existing game being updated
                        case 'modified':
                            console.log('A game was modified');
                            gameIndex = activeGames.findIndex(game => game.id = _id);
                            setActiveGames(prevGames => [
                                ...prevGames.slice(0,gameIndex),
                                newGame
                            ])
                            console.log('activeGames:', activeGames);
                            break;
                        // Handle existing game being deleted
                        // TODO Game could be at end of array, address that
                        case 'removed':
                            console.log('A game was removed');
                            gameIndex = activeGames.findIndex(game => game.id = _id);
                            setActiveGames(prevGames => [
                                ...prevGames.slice(0,gameIndex),
                                ...prevGames.slice(gameIndex+1)
                            ])
                            break;
                    }
                    console.log(activeGames)
                    
                })
            })
            // setUnsub(tempunsub);
        }
        retrieveCollection()

        return () => {
            //@ts-ignore
            unsub();
        }

        
    }, [])

    // Get players from collections
    async function getPlayers(gameid: string, playersRef : firestore.CollectionReference<unknown>) {
        // console.log('Players collection: ', await firestore.getDocs(playersRef));
        let game = activeGames?.find(g => {
            return g.id == gameid;
        })
        let gameplayers = await firestore.getDocs(playersRef)
        //@ts-ignore
        let playerarr = [];
        gameplayers.forEach(player => {
            //@ts-ignore
            playerarr.push(player['_document']['data']['value']['mapValue']['fields'])
        })

        //@ts-ignore
        return playerarr;
    }
    
    async function joinGame(game : GameState) {
        console.log('Redirecting user to new game...');
        setErrorMessage('');

        // If game is valid, redirect to lobby
        if (game) {

            // console.log(game);
            let playersRef = firestore.collection(gamesRef, `${game.id}/players`);
            let players = await firestore.getDocs(playersRef);
            let inGame = false;
            let player : Player
            players.forEach((p) => {
                //@ts-ignore
                if(p['_document']['data']['value']['mapValue']['fields']['name'].stringValue == props.currentUser?.username) {
                    inGame = true;
                    //@ts-ignore
                    player = p['_document']['data']['value']['mapValue']['fields']
                }
                // console.log(p)
            })

            let playerDoc;
            if(!inGame) {
                let newPlayer = {
                    answered: false,
                    name: props.currentUser?.username,
                    points : 0,
                    answered_at: new firestore.Timestamp(1,1)
                }
                playerDoc = await firestore.addDoc(playersRef, newPlayer);
                let newPlayerTemp = await firestore.getDoc(playerDoc);
                player = {
                    answered: newPlayer.answered,
                    name: newPlayer.name,
                    points: newPlayer.points,
                    answered_at: newPlayer.answered_at,
                    id: newPlayerTemp.id
                }
            }
            
            // ALL DIS SHIT IS TO TRIGGER AN UPDATE
            let triggerDocRef = await firestore.doc(gamesRef, `${game.id}`);
            let triggerDoc = await firestore.getDoc(triggerDocRef);
            console.log('Trigger Doc', triggerDoc);
            //@ts-ignore
            await firestore.updateDoc(triggerDocRef, 'trigger', !triggerDoc['_document']['data']['value']['mapValue']['fields']['trigger'].booleanValue)
            //@ts-ignore
            game.players.push(player);
            props.setCurrentGame(game);
            // console.log('Setting game id to: ', game.id);
            props.setCurrentGameId(game.id);
            //@ts-ignore
            // unsub();
            history.push("/game")
        }

        else setErrorMessage('Game with given ID does not exist!');
        
    }

    function findGame(id : string) {
        // TODO Do firebase magic to return GameState object if it exists, or else undefined
        if (id == '111')
            return {
                id: '1',
                name: 'Test Game',
                capacity: 10,
                match_state: 0,
                question_index: 0,
                question_timer: 10,
                start_time: new firestore.Timestamp(1, 1),
                end_time: new firestore.Timestamp(1, 1),
                players: [],
                collection: new Collections('1', 1, 'test', 'test', 'test', new Principal('1', 'test', '1'))
            }
        else return undefined;
    }
    
    const classes = useStyles();
    
    /**
     *  Displays list of active games if any exist, with a join game button, otherwise displays message indicating that none exist.
     *  Displays search for direct game id and a join game button.
     */
    return(
        
        !props.currentUser ? <Redirect to="/login"/> :
        <>
            {/* {console.log('Rerendered page. activeGames: ', activeGames)} */}
             <div id = "jg-component" className={classes.JGameContainer}>
                {/* Prints all active games to the screen */}
                <h1 style = {{color: ' #FFD93D', marginLeft: '1em'}}>JASH Games</h1>
                <div className={classes.TableStyle}>
                <Table  striped bordered hover variant="dark">
                    <thead>
                        <tr>
                            <td>Name</td>
                            <td>Host</td>
                            <td>Collection Name</td>
                            <td>Category</td>
                            <td>Capacity</td>
                            <td></td>
                        </tr>
                    </thead>                    
                    <tbody>
                        {/* {console.log(activeGames, activeGames[0])} */}
                        {/* @ts-ignore */}
                    {activeGames?.map((game, i) =>{ 
                        
                        return  <tr key={i} >
                                            {/* @ts-ignore */}
                                            <td>{game.name}</td>
                                            {/* @ts-ignore */}
                                            <td>{game.host}</td>
                                            {/* {console.log('Collection: ', game.collection)} */}
                                            {/* @ts-ignore */}
                                            <td>{game.collection.title.stringValue}</td>
                                            {/* @ts-ignore */}
                                            <td>{game.collection.category.stringValue}</td>
                                            {/* @ts-ignore */}
                                            <td>{game.players.length + '/' + game.capacity}</td>
                                            <td>
                                                {(game.capacity > game.players.length) ?
                                                
                                                <Button className="btn btn-secondary" onClick={async() => joinGame(game)}>Join Game</Button>
                                                : <></>
                                                }
                                            </td>
                                            </tr> 
                                    })}
                        {/* {console.log(activeGames, activeGames[0])} */}
                        {/* <tr>{activeGames[0].name}</tr> */}
                    </tbody>
                    
                </Table>
                </div>
                {
                    (!activeGames)
                    ?
                        <>
                        
                        <Alert variant="warning">There are currently no active games!</Alert>
                        
                        </>                    
                    :
                        <>
                        </>
                }

                {/* <InputGroup className="mb-3">
                    <FormControl
                    placeholder="Enter Game ID"
                    aria-label="Enter Game ID"
                    aria-describedby="basic-addon2"
                    id="direct-join-id"
                    onChange={e => setGameId(e.target.value)}
                    />
                    {/* <Button className="btn btn-primary" id="direct-join-game" onClick={joinGame}> */}
                    {/* Join Game */}
                    {/* </Button> */}
                {/* </InputGroup> */}
                
                { errorMessage ? <ErrorMessageComponent errorMessage={errorMessage} setErrorMessage={setErrorMessage}/> : <></> }            
            </div>
        </>
    )
}


export default JoinGameComponent;