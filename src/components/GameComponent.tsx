import { Principal } from "../dtos/principal";
import data from "../util/icons.json";

import { Alert, Button, Card, Carousel, Table, ListGroup, ProgressBar } from "react-bootstrap";

import { Redirect , Link, useHistory } from "react-router-dom";
import { GameState } from "../dtos/game-state";
import { useState, useEffect, useRef, createElement } from "react";
import { CardContent, Container, Typography } from "@material-ui/core";
import { makeStyles, withStyles } from "@material-ui/styles";
import TextField, { TextFieldProps } from '@material-ui/core/TextField';
import { classicNameResolver, isPropertySignature } from "typescript";
import { Player } from "../dtos/player";
import { Collections } from "../dtos/collection";
import Timer from "../util/timer";
import '../GameComponent.css'
import Badge from 'react-bootstrap/Badge'
import * as firestore from 'firebase/firestore';
import { getAuth, signInWithPopup, GoogleAuthProvider, } from '@firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import Placeholder from 'react-bootstrap/Placeholder'

import * as FontAwesome from "react-icons/fa";
import * as Ionicons from "react-icons/io5";

import app from '../util/Firebase';

const db = firestore.getFirestore(app);

let streak : number = 0;
let gameLength : number = 0;
let gameProgPercentage : Number = 0;
let numberOfCorrectAnswers : number = 0;
let currentPlayerName : string | undefined ;

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
        backgroundColor : '#282c34',
        justifyContent : 'center',
        color : 'white',
        width: '40rem',
        height : '20rem',
        border : '1em black',
        borderRadius : '.1em' 
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
    },
    GameContainer: {
      justifyContent: "center",
      marginLeft: "37.5rem",
      marginTop: "5rem",
    }

})

const Icon = (props: any) => {
  const { project, iconName, size, color } = props;
  // console.log(`${project}[${iconName}]`)
  let icon;
  // Come back to later...having difficulty dynamically reading project
  if (project == 'FontAwesome') {
      //@ts-ignore
      icon = createElement(FontAwesome[iconName]);
  }
  else if (project == 'Ionicons') {
      //@ts-ignore
      icon = createElement(Ionicons[iconName]);
  }
  return <div style={{ fontSize: `${size}em`, color: color }}>{icon}</div>;
}

const buttonStyle = {
  backgroundColor: '#5f2568',
  border: '#5f2568',
  color: "gold",
  marginLeft: '1em',
  marginTop: '1em'
}

/**
 *  The bread and butter of our application.
 *  
 *  We only want host to maintain match_state/question_index etc.
 * 
 */
 
function GameComponent(props: IGameProps) {

    const classes = useStyles();
    let [game, setGame] = useState(undefined as GameState | undefined);
    let [gamesRef, setGamesRef] = useState(firestore.collection(db, 'games'))
    let [gameDoc, setGameDoc] = useState(undefined as unknown as firestore.DocumentData);
    let [gameDocRef, setGameDocRef] = useState(firestore.doc(gamesRef, `dummy`))
    let [currentPlayer, setCurrentPlayer] = useState(undefined as Player | undefined);
    let [playerID, setPlayerID] = useState(0);
    let [init, setInit] = useState(false);
    let [trigger, setTrigger] = useState(false);
    let [answered, setAnswered] = useState(false);


    let gameUseRef = useRef(game);
    let currentPlayerUseRef = useRef(currentPlayer);
    let gameDocUseRef = useRef(gameDoc);

    let history = useHistory();

    let answer = '';
    

    useEffect(() => {

      async function getDocsAndRefs() {
        let test = await firestore.getDoc(firestore.doc(gamesRef, `${props.currentGameId}`));        
        setGameDoc(test);
        gameDocUseRef.current = test;
        setGameDocRef(firestore.doc(gamesRef, `${props.currentGameId}`))
        
        
      }
      
      if(props.currentGameId) getDocsAndRefs();
      else return;
  
      let unsub : firestore.Unsubscribe = null as unknown as firestore.Unsubscribe;
      const onUpdate = () => {
          unsub = firestore.onSnapshot(firestore.doc(gamesRef, `${props.currentGameId}`), async snapshot => {
              // When a game is deleted, politely escort user out of lobby
              if (!snapshot.exists()) {
                console.log('Game has been deleted! Rerouting to join-game!');
                history.push('/join-game');
                return;
              }
              console.log('ON UPDATE');
              // let temp = await firestore.getDoc(firestore.doc(gamesRef, `${props.currentGameId}`))
              //@ts-ignore
              let temp = snapshot['_document']['data']['value']['mapValue']['fields'];

              let playersRef = firestore.collection(gamesRef, `${props.currentGameId}/players`);
              //@ts-ignore
              let playersDocArr = await getPlayers(props.currentGameId, playersRef);
              let playersArr : Player[] = [];

              console.log('Player array after get players:', playersDocArr);
              let playerNotKicked = false;
              playersDocArr.forEach(player => {
                // console.log('Player:', player);
                playersArr.push(player);
                
                //@ts-ignore
                if (player.name == props.currentUser?.username) {
                  console.log('Current Player:', player)
                  setCurrentPlayer(player);
                  currentPlayerUseRef.current = player;  // This is what actually works for deleting player later
                  setPlayerID(player.id);
                  playerNotKicked = true;
                }
                // else console.log('ABORT: NOT THE SAME PLAYER:', player)
              })
              // Player has been kicked if their player data does not exist in db
              if (!playerNotKicked) {
                console.log('Player is not in player list, must be kicked')
                history.push('/join-game');
              }

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
                created_at: temp.created_at.timestampValue,
                //@ts-ignore
                end_time: temp.end_time.timestampValue,
                //@ts-ignore
                host: temp.host.stringValue,
                //@ts-ignore
                players: playersArr,
                //@ts-ignore
                collection: temp.collection.mapValue.fields
            }
            // console.log("GAME", newGame)
            setGame(newGame);
            gameUseRef.current = newGame;

          })
      }
      onUpdate()

      // When component is unmounted (player leaves page), do a number of things
      return () => {
          console.log('UNMOUNTING GAME COMPONENT');
          console.log('Game in Return', gameUseRef.current);

          // If player is last one in lobby, delete game, but if player is not in list, do not delete     
          if (gameUseRef.current?.players.length == 1 && gameUseRef.current.players.some(temp => temp.name == props.currentUser?.username)) {
            // console.log('Time to delete!');            
            firestore.deleteDoc(firestore.doc(gamesRef, `${props.currentGameId}`));
          } else {
            // Delete player from game
            let playersRef = firestore.collection(gamesRef, `${props.currentGameId}/players`);
            // console.log(playersRef);
            let playerDoc = firestore.doc(playersRef, `${currentPlayerUseRef.current?.id}`)
            firestore.deleteDoc(playerDoc);          

            // Trigger update in firestore
            let temp = firestore.doc(gamesRef, `${props.currentGameId}`);          
            //@ts-ignore
            firestore.updateDoc(temp, 'trigger', !gameDocUseRef.current['_document']['data']['value']['mapValue']['fields']['trigger'].booleanValue)
          }

          // Unsubscribe from snapshot listener
          unsub();
      }
    }, [])

    // Get players from collections
    async function getPlayers(gameid: string, playersRef : firestore.CollectionReference<unknown>) {        
        let gameplayers = await firestore.getDocs(playersRef)
        console.log('Players collection: ', gameplayers);
        //@ts-ignore
        let playerarr = [];
        gameplayers.forEach(player => {
          //@ts-ignore
          let fields = player['_document']['data']['value']['mapValue']['fields']
          let playerStructure = {
            id: player.id,
            name: fields.name.stringValue,
            answered: fields.answered.booleanValue,
            streak: fields.streak.integerValue,
            answered_at: fields.answered_at.timestampValue,
            points : fields.points.integerValue,
            answered_correctly : fields.answered_correctly.booleanValue,
            icon : fields.icon.stringValue
          }
          playerarr.push(playerStructure)
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
      streak = 0;
      numberOfCorrectAnswers = 0;
      
      setTrigger(trigger => !trigger);
    }

    /**
     *  Calls when timer runs out of time
     *  Regular players and host will be calling this function, we want to
     *  make sure that only the host is updating match_state and question_index
     */
    function onTimeout() {
      console.log('The timer has run out');

      //@ts-ignore
      gameLength = game.collection.questionList.arrayValue.values.length;
            
      // When timer runs out of time, game just finished a question
      if (game?.match_state == 2 && props.currentUser?.username == game.host) {
        firestore.updateDoc(gameDocRef, 'match_state', 1);
        clearAnswers();
        setTrigger(trigger => !trigger);
      }

      // When timer runs out of time, game just finished break/answer reveal
      else if (game?.match_state == 1) {    
       
        //@ts-ignore   
        console.log('Question at index', game.collection.questionList.arrayValue.values[game.question_index].mapValue.fields.question.stringValue);
        
        //@ts-ignore
        if (game.question_index == game.collection.questionList.arrayValue.values.length - 1 && props.currentUser?.username == game.host){
           firestore.updateDoc(gameDocRef, 'match_state', 3);
           
        }
        else if (props.currentUser?.username == game.host) {
          firestore.updateDoc(gameDocRef, 'match_state', 2)

          //@ts-ignore
          let currentIndex : number = parseInt(game.question_index);
          let nextIndex : number = currentIndex + 1;
          firestore.updateDoc(gameDocRef, 'question_index', nextIndex);
          setTrigger(!trigger)
           
          //@ts-ignore
          gameProgPercentage = game.question_index as number; 
        }

      }
    }

    async function submit(e: any) {
      console.log("SUBMITTED")
      let playersRef = firestore.collection(gameDocRef, `/players`);
      //@ts-ignore
      let playersDocArr = await firestore.getDocs(playersRef)
      playersDocArr.forEach(async player => {
        //@ts-ignore
        if (player['_document']['data']['value']['mapValue']['fields'].name.stringValue == props.currentUser?.username) {
          let playerRef = firestore.doc(gameDocRef, `/players/${player.id}`)
          // Send current timestamp to firestore (potentially used for scoring later)
          await firestore.updateDoc(playerRef, 'answered_at', firestore.Timestamp.now());
          //this update doesn't trigger callback
          firestore.updateDoc(playerRef, 'answered', true);
          firestore.updateDoc(playerRef, 'streak',  streak);
          // Use this functionality to trigger snapshot listener, as a change to players subcollection does not trigger it
          let temp = await firestore.doc(gamesRef, `${props.currentGameId}`);
          let gameDoc = await firestore.getDoc(temp);
          //@ts-ignore
          await firestore.updateDoc(temp, 'trigger', !gameDoc['_document']['data']['value']['mapValue']['fields']['trigger'].booleanValue)
          setTrigger(!trigger);

          //@ts-ignore
          if (validateAnswer(answer, game.collection.questionList.arrayValue.values[game.question_index].mapValue.fields.answer.stringValue)) {
            // If answer is correct, add points to user
            firestore.updateDoc(playerRef, 'answered_correctly', true)

            // for end of game display
            numberOfCorrectAnswers++;
            streak++;
          }else{
            streak = 0;
            firestore.updateDoc(playerRef, 'streak',  streak);
          }
        }
      })

    }

    /**
     *  This function sets all 'answered' fields to be false after each question.
     *  This function will also update points.
     *  Only the host will call this method.
     */
    async function clearAnswers() {
      let playersRef = firestore.collection(gamesRef, `${props.currentGameId}/players`);
      let playersDocArr = await firestore.getDocs(playersRef)
      playersDocArr.forEach(async player => {
        let playerRef = firestore.doc(gamesRef, `${props.currentGameId}/players/${player.id}`)
        
        
        // Update points 
        // If answer is correct, add points to user
        //@ts-ignore
        if (player['_document']['data']['value']['mapValue']['fields'].answered_correctly.booleanValue == true) {
            //@ts-ignore
            let currentPoints : number = parseInt(player['_document']['data']['value']['mapValue']['fields'].points.integerValue);
            //@ts-ignore
            let value = parseInt(game.collection.questionList.arrayValue.values[game.question_index].mapValue.fields.value.integerValue);

            // Add value of question to total number of points and update Firebase
            currentPoints += value;
            firestore.updateDoc(playerRef, 'points',  currentPoints);
            
            //@ts-ignore
            let currentStreak = player['_document']['data']['value']['mapValue']['fields'].streak.integerValue;
            currentStreak++;
            
            await firestore.updateDoc(playerRef, 'streak',  currentStreak);
            
        }else{          
          await firestore.updateDoc(playerRef, 'streak',  0);
        }
        await firestore.updateDoc(playerRef, 'answered', false);
        await firestore.updateDoc(playerRef, 'answered_correctly', false);
      })
    }
    
    
    /**
     *  This function is used by the host to manually close the game. All players currently
     *  in lobby will be redirected. If the game is not closed through this manner, it will be
     *  automatically closed when the last player leaves the lobby.
     */
    function closeGame() {
      firestore.deleteDoc(firestore.doc(gamesRef, `${props.currentGameId}`));
    }

    /**
     *  TODO: Fill out later
     */
    function validateAnswer(submittedAnswer: string, correctAnswer: string) {
      let correct = false;

      // Take note of acronyms
      // let userAcronym = '';
      // submittedAnswer.split(" ").forEach(word => userAcronym += word[0]);
      // let correctAcronym = '';
      // correctAnswer.split(" ").forEach(word => correctAcronym += word[0]);

      // Trim strings and compare
      let userString = submittedAnswer.toLowerCase().replace(/\s+/g, '');
      let correctString = correctAnswer.toLowerCase().replace(/\s+/g, '');
      console.log('Input string=', userString);
      console.log('Correct string=', correctString);

      // If answer is exactly correct
      if (userString === correctString) correct = true;
      // If string is of sufficient size, check if there is overlap between the two strings
      else if (userString.length > 3 && correctString.length - userString.length < 7 )
        correct = userString.includes(correctString) || correctString.includes(userString);

      console.log('The user answered correctly: ', correct);

      return correct;
    }

    /**
     *  Host can kick a player from the lobby
     *  Very unoptimized (just copied from clearAnswers)
     */
    async function kickPlayer(player : Player) {
      console.log(player)
      let playersRef = firestore.collection(gamesRef, `${props.currentGameId}/players`);      
      let playersDocArr = await firestore.getDocs(playersRef)
      playersDocArr.forEach(async loopPlayer => {
        if (loopPlayer.id == player.id) {
          console.log('Need to delete this bitch')
          let playerRef = firestore.doc(gamesRef, `${props.currentGameId}/players/${loopPlayer.id}`)
          // console.log(playerRef)
          firestore.deleteDoc(playerRef);

          // Send trigger update to firestore
          let temp = await firestore.doc(gamesRef, `${props.currentGameId}`);
          let gameDoc = await firestore.getDoc(temp);
          //@ts-ignore
          console.log(gameDoc['_document']['data']['value']['mapValue']['fields']['trigger'].booleanValue)
          //@ts-ignore
          await firestore.updateDoc(temp, 'trigger', !gameDoc['_document']['data']['value']['mapValue']['fields']['trigger'].booleanValue)
        }
          
      })
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
                <PlayersComponent key={1} players={game?.players} user={props.currentUser} host={game.host} kickPlayer={kickPlayer}/>

                {/* If game state changes to 2, start timer, set game state to 1 when timer ends */}
                {
                  (game.match_state == 1 || game.match_state == 2) ?
                    <Timer initialMinute={0} initialSeconds={game.question_timer} onTimeout={onTimeout} />
                  : <></>
              }

              {                
                (game.match_state == 2) ?
                <>

                {/* Question and Answer */}
                <div className={classes.GameContainer}>
                <Card style={{ width: '45rem' , backgroundColor:'white' }} className="text-center">

                <Card.Header as="h5" >
                  Welcome To *JASH*
                  <Card.Title> 
                  <br></br>
                     {/* @ts-ignore */}
                  <h4>Question {parseInt(game.question_index) + 1} out of {game.collection.questionList.arrayValue.values.length}</h4>
                  {/* @ts-ignore */}
                <ProgressBar min={0} max={game.collection.questionList.arrayValue.values.length} style={{ width: '30rem' }} animated now={parseInt(game.question_index) + 1} />
                </Card.Title>
                </Card.Header>
                            <Card.Body >
                              <Card.Body id="div-for-question"  style={{ backgroundColor:'black' , color : 'grey'}}>
                                  <br></br>
                                  <br></br>
                                   <h3>
                                     {/* @ts-ignore */}
                                  {game.collection.questionList.arrayValue.values[game.question_index].mapValue.fields.question.stringValue}? <Badge bg="success">{game.collection.questionList.arrayValue.values[game.question_index].mapValue.fields.value.integerValue} Points!</Badge>
                                  </h3> 
                                  <br></br>
                                 <br></br>
                                </Card.Body>  
                                <Card.Footer>
                                {(!game.players.find((p) => p.name === props.currentUser?.username)?.answered) ?
                                  <>
                                    <CssTextField id="answer-input" type="text" onChange={(e) => {answer=e.target.value}} />
                                    <Button className="btn btn-primary"  title="enter" onClick={submit}>Answer</Button>
                                  </>
                                :
                                  <>
                                  </>
                                }
                                </Card.Footer>
                            </Card.Body>
                      </Card> 
                      </div>
                </>
                : <></>
              }

              { 
                
                (game.match_state == 1) ?
                <>
                <div className={classes.GameContainer}>
          <Card style={{ width: '45rem' , backgroundColor:'white' }} className="text-center">
          
          <Card.Header as="h5" >
            Welcome To *JASH*
            <Card.Title> 
            <br></br>
              {/* @ts-ignore */}
            <h4>Question {parseInt(game.question_index) + 1} out of {game.collection.questionList.arrayValue.values.length}</h4>
            {/* @ts-ignore */}
          <ProgressBar min={0} max={game.collection.questionList.arrayValue.values.length} style={{ width: '30rem' }} animated now={parseInt(game.question_index) + 1} />
          </Card.Title>
          </Card.Header>
                      <Card.Body >
                        <Card.Body id="div-for-question"  style={{ backgroundColor:'black' , color : 'grey'}}>
                            <br></br>
                            <br></br>
                            <br></br>
                            <br></br>

                            <h3 >
                              {/* @ts-ignore */}
                            {game.collection.questionList.arrayValue.values[game.question_index].mapValue.fields.answer.stringValue}!<Badge bg="success">{game.collection.questionList.arrayValue.values[game.question_index].mapValue.fields.value.integerValue} Points!</Badge>
                            </h3> 
                        
                            <br></br>
                            <br></br>
                            <br></br>
                            <br></br>
                          </Card.Body>  
                          <Card.Footer>
                          
                          </Card.Footer>
                      </Card.Body>
                </Card>
                </div>
                
                </>
                : <></>
              }

              
              {/* End of Game */}
              {
                (game.match_state == 3) ?
                <>
                  <LeaderboardComponent key={3} players={game?.players} />
                  
                </> 
                : <> </>
              }

              {/* Host Capabilities */}
              {/* Before the game is started, host can start the game. 
                  When the game is finished, and idle on the leaderboard screen, host can close the game. */}
              {(props.currentUser.username === game?.host)
              ?
                <>
                  {
                    (game.match_state == 0) ?
                    <Button style = {buttonStyle}  onClick={startGame}>
                    Start Game!
                    </Button>
                    : <> </>
                  }
                  {
                    (game.match_state == 3) ?
                    <Button style={buttonStyle} className="btn btn-primary" title="Close Game" onClick={closeGame}>Close Game</Button>
                    : <> </>
                  }
                </>
              : <> </>
              }
              </>

            : <></>
            }
            
        </>
        :
        <>
          {/* Game is undefined. Shouldn't happen, but we have a failsafe. */}
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
                                {/* DYNAMIC ID: Id will be usertrue if current user, otherwise userfalse */}
                                {/* @ts-ignore */}
                                <td id={"user" + (player.name == props.user.username)}>
                                 
                                  {/* @ts-ignore */}
                                  {/* {console.log("user" + (player.name == props.user.username), player.name, props.user.username)} */}
                                  {
                                    data.map(({project, name, color}) => {
                                      // {console.log(project, name, color)}
                                      if(name == player.icon)
                                      return (
                                        <>
                                              <Icon project={project} iconName={name} size={2} color={color} /> {player.name} | {player.points} points {player.streak > 1 ? <p>&#x1F525;</p> : <p></p>}
                                        </>
                                      )
                                  })
                                  }

                                  {
                                    // Host player has Kick Player buttons attached to other players
                                    (props.user.username == props.host && player.name != props.user.username) ?
                                    <Button style={buttonStyle} onClick={() => props.kickPlayer(player)}>Kick Player</Button>
                                    : <></>
                                  }
                                </td>
                            </tr>
                          })}
                    </tbody>
       </Table>
     
  )
}


/**
 *  The LeaderboardComponent displays at the end of the game (match_state 3) and gives a short summary of the game.
 *  ie. Players are displayed in descending order of points to show placings.
 *  
 */
function LeaderboardComponent(props: any) {
  // Sort the players in descending order of points
  function compare( a: Player, b: Player ) {
    //@ts-ignore
    if ( parseInt(a.points) > parseInt(b.points) ){
      console.log(a, ' has more points than ', b, ' Sorting b after a')
      return -1;
    }
    //@ts-ignore
    if ( parseInt(a.points) > parseInt(b.points) ){
      console.log(b, ' has more points than ', a, ' Sorting a after b')
      return 1;
    }
    console.log(a, ' and ', b, ' have the same number of points, no sorting necessary');
    return 0;
  }

  // @ts-ignore
  const players : Player[] = [].concat(props.players).sort(compare);
  console.log('Sorted players array at end of game:', players)

  return (
    <Container>
      {players.map(function(player, i) {
                            return <Card key={i}>
                                <h1>
                                  {/* @ts-ignore */}
                                  {/* Global Emoji Codes */}
                                  {/* ---------------------------*/}
                                  {/* let poop_emoji = 1F4A9;   |*/}
                                  {/* let trophy_emoji = 1F3C6; |*/}
                                  {/* let crown_emoji = 1F451;  |*/}
                                  {/* ---------------------------*/}
                                  {console.log('Player=', player)}
                                  {console.log('GameLength=', gameLength)}
                                  {console.log('numberOfCorrectAnswers=', numberOfCorrectAnswers)}
                                  {player.name} | {player.points} points   { i > 0 ? <h1>&#x1F4A9;</h1>  : gameLength === numberOfCorrectAnswers ? <h1>&#x1F451;</h1>  : numberOfCorrectAnswers === 0 ? <h1>&#x1F4A9;</h1> : <h1>&#x1F3C6;</h1>}
                                </h1>
                            </Card>
                          })}
    </Container>
  )

}

export default GameComponent;