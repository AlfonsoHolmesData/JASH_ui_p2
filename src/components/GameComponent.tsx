import { Principal } from "../dtos/principal";
import { Alert, Button, Card, Carousel, Table, ListGroup } from "react-bootstrap";
import { Redirect , Link, useLocation } from "react-router-dom";
import { GameState } from "../dtos/game-state";
import { useState, useEffect } from "react";
import { CardContent, Container, Typography } from "@material-ui/core";
import { makeStyles, withStyles } from "@material-ui/styles";
import TextField, { TextFieldProps } from '@material-ui/core/TextField';
import { classicNameResolver } from "typescript";
import { Player } from "../dtos/player";
import { Collections } from "../dtos/collection";
import Timer from "../util/timer";
import '../GameComponent.css'

import * as firestore from 'firebase/firestore';
import { getAuth, signInWithPopup, GoogleAuthProvider, } from '@firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';

import app from '../util/Firebase';

const db = firestore.getFirestore(app);



interface IGameProps {
  currentUser: Principal | undefined;
  currentGameId : string | undefined;

}

const CssTextField = withStyles({
    root: {
      '& label.Mui-focused': {
        color: 'green',
      },
      '& .MuiInput-underline:after': {
        borderBottomColor: 'green',
      },
      '& .MuiOutlinedInput-root': {
        '& fieldset': {
          borderColor: 'red',
        },
        '&:hover fieldset': {
          borderColor: 'yellow',
        },
        '&.Mui-focused fieldset': {
          borderColor: 'green',
        },
      },
    },
  })(TextField);

const useStyles= makeStyles({
    question : {
        backgroundColor : 'black',
        justifyContent : 'center',
        color : 'white',
        width : '35rem',
        height : '20rem',
        border : '1em black',
        borderRadius : '2em' 
    },
    questionAnswer : {
        // backgroundColor : 'limegreen',
        width: '50%',
        border : '2em black',
        borderRadius : '2em' 
    },
    input : {
        paddingTop : '1em',
        marginLeft : '2em',
        marginRight : '2em'
    }

})

function GameComponent(props: IGameProps) {

    const classes = useStyles();
    let [game, setGame] = useState(undefined as GameState | undefined);
    let [gamesRef, setGamesRef] = useState(firestore.collection(db, 'games'))
    let [gameDocRef, setGameDocRef] = useState(firestore.doc(gamesRef, `dummy`))
    let [init, setInit] = useState(false);
    let [trigger, setTrigger] = useState(false);

    let answer = '';

    useEffect(() => {
      
      if(props.currentGameId) {
        setGameDocRef(firestore.doc(gamesRef, `${props.currentGameId}`))
      } else {
        return;
      }
  
      let unsub : firestore.Unsubscribe = null as unknown as firestore.Unsubscribe;
      const onUpdate = () => {
          unsub = firestore.onSnapshot(gamesRef, async snapshot => {
              console.log('ON UPDATE');
              let temp = await firestore.getDoc(firestore.doc(gamesRef, `${props.currentGameId}`))
              //@ts-ignore
              temp = temp['_document']['data']['value']['mapValue']['fields'];

              let playersRef = firestore.collection(gamesRef, `${props.currentGameId}/players`);
              //@ts-ignore
              let playersDocArr = await getPlayers(props.currentGameId, playersRef);
              let playersArr : Player[] = [];
              //@ts-ignore
              playersDocArr.forEach(player => {
                // console.log('Player:', player);
                playersArr.push(player);
              })

              let newGame : GameState = {
                id: props.currentGameId as string,
                //@ts-ignore
                name: temp.name.stringValue,
                //@ts-ignore
                capacity: temp.capacity.integerValue,
                //@ts-ignore
                match_state: temp.match_state.integerValue,
                //@ts-ignore
                question_index: temp.question_index.integerValue,
                //@ts-ignore
                question_timer: temp.question_timer.integerValue,
                //@ts-ignore
                start_time: temp.start_time.timestampValue,
                //@ts-ignore
                end_time: temp.end_time.timestampValue,
                //@ts-ignore
                host: temp.host.stringValue,
                //@ts-ignore
                players: playersArr,
                //@ts-ignore
                collection: temp.collection.mapValue.fields
            }
            console.log(newGame)
            setGame(newGame);

          })
      }
      onUpdate()

      return () => {
          unsub();
      }
    }, [])

    // Get players from collections
    async function getPlayers(gameid: string, playersRef : firestore.CollectionReference<unknown>) {
        console.log('Players collection: ', await firestore.getDocs(playersRef));
        
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

    function checkInit() {
      if(!init) {
        setInit(true)
      }
    }

    /**  
     *  Start Game sends an update to Firebase, which trigger our snapshot listener in useEffect
     *  Inside of the snapshot listener, we set our game state to 2, and update our game state accordingly
     */
    async function startGame() {
      console.log("The game is starting right now!");
      await firestore.updateDoc(gameDocRef, 'match_state', 2);
      setTrigger(trigger => !trigger);
    }

    /**
     *  Calls when timer runs out of time
     */
    function onTimeout() {
      console.log('The timer has run out');
      // When timer runs out of time, game just finished a question
      if (game?.match_state == 2) {
        firestore.updateDoc(gameDocRef, 'match_state', 1);
        clearAnswers();
      }

      // When timer runs out of time, game just finished break/answer reveal
      else if (game?.match_state == 1) {    
        //@ts-ignore   
        console.log('Question at index', game.collection.questionList.arrayValue.values[game.question_index].mapValue.fields.question.stringValue) 
        //@ts-ignore
        if (game.question_index == game.collection.questionList.arrayValue.values.length - 1)
          firestore.updateDoc(gameDocRef, 'match_state', 3);
        else {
          firestore.updateDoc(gameDocRef, 'match_state', 2)
          //@ts-ignore
          let currentIndex : number = parseInt(game.question_index);
          let nextIndex : number = currentIndex + 1;
          firestore.updateDoc(gameDocRef, 'question_index', nextIndex);
        }
      }
      setTrigger(trigger => !trigger);
    }

    async function submit(e: any) {
      let playersRef = firestore.collection(gamesRef, `${props.currentGameId}/players`);
      //@ts-ignore
      let playersDocArr = await firestore.getDocs(playersRef)
      playersDocArr.forEach(player => {
        //@ts-ignore
        if (player['_document']['data']['value']['mapValue']['fields'].name.stringValue == props.currentUser?.username) {
          // firestore.updateDoc(player)
          let playerRef = firestore.doc(gamesRef, `${props.currentGameId}/players/${player.id}`)
          firestore.updateDoc(playerRef, 'answered', true);          
          
          console.log("submission:", answer)
          // TODO Validate answer better
          //@ts-ignore
          if (validateAnswer(answer, game.collection.questionList.arrayValue.values[game.question_index].mapValue.fields.answer.stringValue)) {
            // If answer is correct, add points to user
            //@ts-ignore
            let currentPoints : number = parseInt(player['_document']['data']['value']['mapValue']['fields'].points.integerValue);

            console.log('current points: ', currentPoints);
            //@ts-ignore
            let value = parseInt(game.collection.questionList.arrayValue.values[game.question_index].mapValue.fields.value.integerValue);
            console.log('value: ', value);

            currentPoints += value;
            console.log('current points: ', currentPoints);
            //@ts-ignore
            firestore.updateDoc(playerRef, 'points',  currentPoints);
          }
        }
      })

    }

    /**
     *  This function sets all 'answered' fields to be false after each question
     */
    async function clearAnswers() {
      let playersRef = firestore.collection(gamesRef, `${props.currentGameId}/players`);
      //@ts-ignore
      let playersDocArr = await firestore.getDocs(playersRef)
      playersDocArr.forEach(player => {
        //@ts-ignore
        if (player['_document']['data']['value']['mapValue']['fields'].name == props.currentUser?.username) {
          // firestore.updateDoc(player)
          let playerRef = firestore.doc(gamesRef, `${props.currentGameId}/players/${player.id}`)
          firestore.updateDoc(playerRef, 'answered', false);
        }
      })
    }

    /**
     *  TODO: Fill out later
     */
    function validateAnswer(submittedAnswer: string, correctAnswer: string) {
      // Trim strings and compare
      return true;
    }

    /**
     *  We want to display a question field, an answer+submit field, and a list of players.
     *  Game States:
     *    - 0: Waiting to start
     *    - 1: Started, no questions
     *    - 2: Started, questions
     *    - 3: Ended
     */
    return (
        props.currentUser && props.currentGameId//&& props.currentGame
        ?
        <>
            
            {(game) ?
              <>
              {checkInit}
              {console.log('GAME RERENDER: ', game)}
              {console.log('Rerendered: ', props.currentGameId, game.match_state)}              
              {/* Player List */}
              {console.log('Players AND game in return line 187', game?.players, game)}
              <PlayersComponent key={true} players={game?.players} />

              {/* If game state changes to 2, start timer, set game state to 1 when timer ends */}
              {
                (game.match_state == 1 || game.match_state == 2) ?
                  <Timer initialMinute={0} initialSeconds={3} onTimeout={onTimeout} />
                  : <></>
              }

              {                
                (game.match_state == 2) ?
                <>

                {/* Question and Answer */}
                <Container className={classes.questionAnswer}>
                    <Container id="div-for-question" className={classes.question}>
                    <h1>
                      {/* @ts-ignore */}
                      {console.log(game.collection.questionList.arrayValue.values[game.question_index].mapValue.fields.question.stringValue)}
                      {/* @ts-ignore */}
                      {game.collection.questionList.arrayValue.values[game.question_index].mapValue.fields.question.stringValue}
                    </h1>
                    <h2>
                      {/* @ts-ignore */}
                      {game.collection.questionList.arrayValue.values[game.question_index].mapValue.fields.value.integerValue}
                    </h2>
                    
                    </Container>
                    <Container id="input-container" className={classes.input}>
                        <CssTextField id="answer-input" type="text" onChange={(e) => {answer=e.target.value}} />
                        <Button className="btn btn-primary" id="submit-answer" title="enter" onClick={submit}>Answer</Button>
                    </Container>
                </Container>
                </>
                : <></>
              }

              { 
                
                (game.match_state == 1) ?
                <>

                {/* Question Answer */}
                <Container className={classes.questionAnswer}>
                    <Container id="div-for-question" className={classes.question}>
                    <h1>
                      {/* @ts-ignore */}
                      {console.log(game.collection.questionList.arrayValue.values[game.question_index].mapValue.fields.answer.stringValue)}
                      {/* @ts-ignore */}
                      {game.collection.questionList.arrayValue.values[game.question_index].mapValue.fields.answer.stringValue}
                      </h1>
                    
                    </Container>
                </Container>
                </>
                : <></>
              }

              {/* Host Capabilities */}
              {(props.currentUser.username === game?.host && game.match_state == 0)
              ?
                <>
                  <Button onClick={startGame}>
                    Start Game!
                  </Button>
                </>
              :
                <>
                
                </>
              }
              </>

            : <></>}
            
        </>
        :
        <>
        {console.log('REDIRECTING TO JOIN')}
        <Redirect to="/join-game"/>
        </>
    )
}

function QuestionComponent() {

}

function PlayersComponent(props: any) {

  const players : Player[] = props.players;

  return (
      
      <Table  striped bordered hover variant="dark" id="players-component">
                    <thead>
                        <tr>
                          <td><h5 color="yellow">Players</h5></td>
                        </tr>
                    </thead>
                    <tbody>
                    {players.map(function(player, i) {
                            return <tr key={i}>
                                <td>
                                  {/* @ts-ignore */}
                                  {player.name.stringValue}
                                </td>
                            </tr>
                          })}
                    </tbody>
       </Table>
     
  )
}

export default GameComponent;