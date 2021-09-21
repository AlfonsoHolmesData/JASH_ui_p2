import {useState} from "react";
import {Principal} from "../dtos/principal";
import {GameSettings} from "../dtos/game-settings";
import {getFavorites, getSavedCollections} from "../remote/user-service";
import ErrorMessageComponent from "./ErrorMessageComponent";
import { Redirect , Link, useHistory } from "react-router-dom";
import { Collections } from "../dtos/collection";
import Table from 'react-bootstrap/Table'
import Button from 'react-bootstrap/Button'
import { Alert, Card, ListGroup } from "react-bootstrap";
import GameSettingsModal from "./game-modals/GameSettingsModal";
import { Question } from "../dtos/question";
import * as firestore from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import app from '../util/Firebase';
import { getRandQuestion } from "../remote/question-service";
import { GameState } from "../dtos/game-state";
import { makeStyles } from "@material-ui/core";


const db = firestore.getFirestore(app);

let targetsCollections :  [] | undefined;
let targetsFavoriteCollections :  [] | undefined;
let targetCollectionQuestionsList :  Question[] | undefined;
let globalKey : Number | undefined;
let collectionVisible : boolean = false;
let favCollectionVisible : boolean = false;
let collectionQLVisible : boolean = false;
let showCollectionText = "Show Collections";
let showFavCollectionText = "Show Favorites"
let showQuestionListText ="Preview";

interface IGameCustomCollectionProps {
    currentUser: Principal | undefined,
    currentGameId: string,
    setCurrentGameId: ((gameId: string) => void),
    selectedCollection: Collections | undefined,
    setSelectedCollection: (nextCollection: Collections | undefined) => void
    currentCollections:  [] | undefined,
    setCurrentCollection: (nextCollection:  [] | undefined) => void,
    currentGameSettings_:  GameSettings | undefined,
    setCurrentGameSettings_: (nextCollection: GameSettings | undefined) => void
    userIcon: string | undefined;
}
const useStyles = makeStyles({
    CreateContainer: {
        backgroundColor: "black",
        opacity: .94,
        justifyContent: "center",
        marginLeft: "10rem",
        marginTop: "5rem",
        width: "75%",
        height:"75%",
        borderRadius: "8em",
        border: "white",
    },
    TableStyle: {
        display:'flex',
        width: '100%',  
        maxHeight: '300px',
        overflowY: "scroll",
    }
})

const buttonStyle = {
    backgroundColor: '#5f2568',
    border: '#5f2568',
    color: "gold",
  }


function CustomGameComponent(props: IGameCustomCollectionProps) {
    let [collectionTitle , setCollectionTitle] = useState('');
    let [collectionCategory , setCollectionCategory] = useState(''); 
    let [collectionAuthor , setCollectionAuthor] = useState('');
    let [errorMessage, setErrorMessage] = useState('');
    let [showSettings, setShowSettings] = useState(false);
    let [currentCollection, setCurrentCollection] = useState(undefined as Collections | undefined);
    let [currentQL, setQL] = useState(undefined as Question[] | undefined);
    let history = useHistory();

    function displayModal() {
        setShowSettings(true);
        return undefined;
    }

    function getModal() {
        if(showSettings) {
            props.setSelectedCollection(currentCollection);
            return <GameSettingsModal  current_user={props.currentUser} selectedCollection={props.selectedCollection} currentGameSettings={props.currentGameSettings_} setCurrentGameSettings={props.setCurrentGameSettings_} show={showSettings} setShow={setShowSettings} />;
        }
    }

    /**
     *  Used to shuffle the question list in a collection
     */
    function shuffle(array: any[]) {
        let currentIndex = array.length,  randomIndex;
      
        // While there remain elements to shuffle...
        while (currentIndex != 0) {
      
          // Pick a remaining element...
          randomIndex = Math.floor(Math.random() * currentIndex);
          currentIndex--;
      
          // And swap it with the current element.
          [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
        }
      
        return array;
      }

    // Translate game settings into a Game State and store in Firestore db
    async function sendGameSettings()
    {
        const gamesRef = firestore.collection(db , "games");
        console.log('Current Game Settings:', props.currentGameSettings_);
        if (!props.currentGameSettings_) {
            console.log('Current Game Settings:', props.currentGameSettings_);
            return;
        } else console.log('Props are truthy!');

        // Shuffle question list in collection
        let newCollection = props.currentGameSettings_.collection;
        //@ts-ignore
        newCollection?.questionList.splice(0, newCollection?.questionList.length, ...shuffle(newCollection?.questionList));

        let newGame = {
            name: props.currentGameSettings_.name,
            capacity: props.currentGameSettings_.maxPlayers,
            match_state: 0,
            question_index: 0,
            question_timer: props.currentGameSettings_.matchTimer,
            created_at: firestore.Timestamp.now(),
            end_time: new firestore.Timestamp(1,1),
            host: props.currentUser?.username,
            collection: newCollection,
            trigger: true
        };
        console.log('Before new game log');
        console.log('New game!', newGame)
        console.log('After new game log');

        let userIcon = props.userIcon ? props.userIcon : 'FaRegUserCircle';
        let gameDocRef = await firestore.addDoc(gamesRef , newGame);
        console.log('Setting game Id to: ', gameDocRef.id);
        props.setCurrentGameId(gameDocRef.id);
        let playersRef = firestore.collection(gamesRef, `${gameDocRef.id}/players`);
        let newPlayer = {
            answered: false,
            answered_correctly: false,
            name: props.currentUser?.username,
            points : 0,
            answered_at: new firestore.Timestamp(1,1),
            icon : userIcon,
            streak: 0,
            placing: 0
        }
        let playerDoc = await firestore.addDoc(playersRef, newPlayer);

        // Trigger update to snapshot listeners
        let gameDoc = await firestore.getDoc(gameDocRef);              
        //@ts-ignore
        firestore.updateDoc(gameDocRef, 'trigger', !gameDoc['_document']['data']['value']['mapValue']['fields']['trigger'].booleanValue)

        history.push('/game');
    }


    function displayQuestions(e : any) { 
        
       console.log("pressed");
         

           if(collectionQLVisible === false){

                   console.log(" on");
                collectionQLVisible = true;
                showQuestionListText = "Preview";
                setQL(currentCollection?.questionList);
                targetCollectionQuestionsList = currentQL ;
                props.setSelectedCollection(currentCollection);
           
           }else{
            console.log(" off ");
           

                collectionQLVisible = false;
                showQuestionListText = "-";  
             
                setQL(undefined);
                targetCollectionQuestionsList = currentQL ;
                 props.setSelectedCollection(currentCollection);
               
           }

                
             //  currentCollection.questionList = [];
             
             
           }
            
  
    

    function selectCollection(e: any , key: any)
    {
        if(targetsCollections)
        {
            targetCollectionQuestionsList = [];
            showQuestionListText = "Preview";
            setCurrentCollection(targetsCollections[key]);
            props.setSelectedCollection(currentCollection);
            let maxPlayers: Number = 4;
            let matchTimer : Number = 30;
            let collection : Collections = targetsCollections[key] as Collections;
            let category : string | undefined = currentCollection?.category;
            let name: string = 'new collection';
            props.setCurrentGameSettings_({maxPlayers   , matchTimer , collection  , category  , name });
            
            console.log("key : " , key ,  " value : " , targetsCollections[key]);
        }
      
    }

    function selectFavoriteCollection(e: any , key: any)
    {
        if(targetsFavoriteCollections)
        {
            targetCollectionQuestionsList = [];
            showQuestionListText = "Preview";
            setCurrentCollection(targetsFavoriteCollections[key]);
            props.setSelectedCollection(currentCollection);
            let maxPlayers: Number = 4;
            let matchTimer : Number = 15;
            let collection : Collections = targetsFavoriteCollections[key] as Collections;
            let category : string | undefined = currentCollection?.category;
            let name: string = 'new collection';
            props.setCurrentGameSettings_({maxPlayers   , matchTimer , collection  , category  , name });
            
            console.log("key : " , key ,  " value : " , targetsFavoriteCollections[key]);
        }
      
    }

    async function getFavoriteCollections(){
        
        try {
                if(favCollectionVisible === false && props.currentUser)
                {
                    showFavCollectionText = "Hide Favorites" ;
                    //@ts-ignore
                    let user_id = props.currentUser.id;
                    targetsFavoriteCollections = await getFavorites( user_id, props.currentUser.token );  
                    
                    
                    props.setCurrentCollection(targetsFavoriteCollections);
                    
                } else if (favCollectionVisible === true && props.currentUser)  {

                    showFavCollectionText = "Show Favorites" ;
                    targetsFavoriteCollections = undefined;
                    props.setCurrentCollection(targetsFavoriteCollections);
                    
                    
                }else {

                    setErrorMessage('signed in You must be');
                }

                favCollectionVisible = !favCollectionVisible;
                console.log("Collections Visiblity : " + favCollectionVisible);
                

           }catch (e: any) {
            setErrorMessage(e.message); 
             }  
    }

    async function getCollection() {
        
        try {
                if(collectionVisible === false && props.currentUser)
                {
                    showCollectionText = "Hide Collections" ;
                    //@ts-ignore
                    let user_id = props.currentUser.id;
                    targetsCollections = await getSavedCollections( user_id, props.currentUser.token );  
                    
                    
                    props.setCurrentCollection(targetsCollections);
                    
                } else if (collectionVisible === true && props.currentUser)  {

                    showCollectionText = "Show Collections" ;
                    targetsCollections = undefined;
                    props.setCurrentCollection(targetsCollections);
                    
                    
                }else {

                    setErrorMessage('signed in You must be');
                }

                collectionVisible = !collectionVisible;
                console.log("Collections Visiblity : " + collectionVisible);
                console.log("Questions Visiblity : " + collectionQLVisible);

           }catch (e: any) {
            setErrorMessage(e.message); 
             }  
    }

    async function generateRandom() {
        let collection : Collections = {
            id: '-1',
            key_: -1,
            title: 'Random Collection',
            description: 'Randomly generated from jservice.io API',
            category: 'Random',
            author: {
                id: '',
                username: '',
                token: ''
            },
            questionList: [] as Question[]
        }

        for(let i = 0; i < 10; i++) {
            let question = await getRandQuestion(collection.id);
            collection.questionList.push(question)
        }
        console.log(collection)
        setCurrentCollection(collection)
    }
    
    const classes = useStyles();
    return(
        !props.currentUser ? <Redirect to="/login"/> :
        <>
        
             <div id="custom-component" className={classes.CreateContainer}>
                 <br></br>
                 <br></br>
                 <h1 style = {{color: ' #FFD93D', marginLeft: '1em'}}>Create Game</h1>
                {/* prints all user collections to the screen */}
                <div className={classes.TableStyle}>
                <Table  striped bordered hover variant="dark">
                    <thead>
                        <tr>
                          <td>Collection Title</td>
                          <td>Collection Category</td>
                          <td>Collection Description</td>
                          <td>Author</td>
                          <td>Size</td>
                          <td>  {/* sets target collection to users collection */} <Button style={buttonStyle} variant="secondary" id="show-collections-btn" className="btn btn-primary" onClick={getCollection}>{`${showCollectionText.toString()}`}</Button> {  }
                          <Button style={buttonStyle} variant="secondary" id="show-collections-btn" className="btn btn-secondary" onClick={getFavoriteCollections}>{`  ${showFavCollectionText.toString()}`}</Button></td>
                        </tr>
                    </thead>
                    <tbody>
                    {/* god loop */}
                    {/* ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */}
                    {targetsCollections?.map((C : Collections | undefined , i ) =>{
                           return  <tr key={i} >
                                             <td>{C?.title} </td>
                                             <td>{C?.category}</td>
                                             <td>{C?.description}</td>
                                             <td>{C?.author.username.toString()}</td>
                                             <td>{C?.questionList.length.toString()}</td>
                                             <td> <Button style={buttonStyle} variant="light" key={i} onClick={(e) => selectCollection( e , i)}> Select</Button></td>
                                            </tr> 
                                      })}
                     {/* ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++=+ */} 
                   
                        {targetsFavoriteCollections?.map((C : Collections | undefined , i ) =>{
                           return  <tr key={i} >
                                             <td>{C?.title} </td>
                                             <td>{C?.category}</td>
                                             <td>{C?.description}</td>
                                             <td>{C?.author.username.toString()}</td>
                                             <td>{C?.questionList.length.toString()}</td>
                                             <td> <Button style={buttonStyle} variant="light" key={i} onClick={(e) => selectFavoriteCollection( e , i)}> Select</Button></td>
                                            </tr> 
                                      })}
                     {/* ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++=+ */}

                    </tbody>
                </Table >
                </div>
               
               

                
                <Button style={buttonStyle} variant="light" onClick={generateRandom} > Create Random Collection</Button>

                <table style={{marginLeft: "11em"}}>
                    <tbody>
                        <tr>
                            <td>
                            <Card style={{ width: '22rem' }} className="bg-dark text-white" >
                            <Card.Body>
                                <Card.Title>Game Manager</Card.Title>
                                
                                
                                <Card.Text>
                                  Set up your game
                                </Card.Text>
                                <Button style={buttonStyle} variant="light" onClick={displayModal}>Game Settings</Button>
                                {getModal()}
                            </Card.Body>
                            </Card> 
                            
                            </td>
                            <td>
                            <Card style={{ width: '22rem' }} className="bg-dark text-white">
                           
                            <Card.Body>
                                <Card.Title>Game Initiator</Card.Title>

                                <Card.Text>
                                <br />
                                <ListGroup  >
                                    <ListGroup.Item ><h6>Summary</h6></ListGroup.Item>
                                    <ListGroup.Item variant="light">  Collection : "{currentCollection?.title}"</ListGroup.Item>
                                    <ListGroup.Item variant="light">Match time : {props.currentGameSettings_?.matchTimer} (seconds)</ListGroup.Item>
                                    <ListGroup.Item variant="light">Category : {currentCollection?.category}</ListGroup.Item>
                                    <ListGroup.Item variant="light">Max Players : {props.currentGameSettings_?.maxPlayers}</ListGroup.Item>
                                    <ListGroup.Item variant="light"> Name : {props.currentGameSettings_?.name}</ListGroup.Item>
                                </ListGroup>
                               
                                </Card.Text>
                                {
                                     currentCollection?.category ? 
                                     <Button className="btn btn-success"variant="success outline-dark"   onClick={sendGameSettings} >Start Game</Button>
                                     :

                                     <Alert variant="warning">
                                     <Alert.Heading>Cant Play Without Collection</Alert.Heading>
                                   </Alert>
                                     
                                }
                                
                            </Card.Body>
                         
                            </Card>
                            </td>
                            <td>
                            <Card style={{ width: '22rem' }} className="bg-dark text-white">
                            <Card.Body>
                                <Card.Title>Game Inspect</Card.Title>
                                <Card.Text>
                                 See the "{currentCollection?.title}" Preview here! 
                                </Card.Text>
                                <Button style={buttonStyle}  variant="light" onClick={displayQuestions} >{showQuestionListText.toString()}</Button>
                            </Card.Body>
                             <br></br>
                                <ListGroup >
                                    <ListGroup.Item ><h6>Questions</h6></ListGroup.Item>
                                    {targetCollectionQuestionsList?.map((q : Question | undefined , i) =>{ return <ListGroup.Item key={i} variant="light">{q?.question}</ListGroup.Item>})}
                                </ListGroup>
                            </Card>
                            </td>
                        </tr>
                    </tbody>
                </table>
                { errorMessage ? <ErrorMessageComponent errorMessage={errorMessage} setErrorMessage={setErrorMessage}/> : <></> }            
                </div>
        </>
    )
}

export default CustomGameComponent;