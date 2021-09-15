import {useState} from "react";
import {Principal} from "../dtos/principal";
import {GameSettings} from "../dtos/game-settings";
import {getFavorites, getSavedCollections} from "../remote/user-service";
import ErrorMessageComponent from "./ErrorMessageComponent";
import { Redirect , Link } from "react-router-dom";
import { Collections } from "../dtos/collection";
import Table from 'react-bootstrap/Table'
import Button from 'react-bootstrap/Button'
import { Alert, Card, ListGroup } from "react-bootstrap";
import GameSettingsModal from "./game-modals/GameSettingsModal";
import { Question } from "../dtos/question";
import * as firestore from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import app from '../util/Firebase';
import { stringify } from "querystring";


const db = firestore.getFirestore(app);

let targetsCollections :  [] | undefined;
let targetsFavoriteCollections :  [] | undefined;
let targetCollectionQuestionsList :  [] | undefined;
let globalKey : Number | undefined;
let collectionVisible : boolean = false;
let favCollectionVisible : boolean = false;
let collectionQLVisible : boolean = false;
let showCollectionText = "Show Collections";
let showFavCollectionText = "Show Favorites"
let showQuestionListText ="Preview";

interface IGameCustomCollectionProps {
    currentUser: Principal | undefined,
    selectedCollection: Collections | undefined,
    setSelectedCollection: (nextCollection: Collections | undefined) => void
    currentCollections:  [] | undefined,
    setCurrentCollection: (nextCollection:  [] | undefined) => void,
    currentGameSettings_:  GameSettings | undefined,
    setCurrentGameSettings_: (nextCollection: GameSettings | undefined) => void
}


function CustomGameComponent(props: IGameCustomCollectionProps) {
    let [collectionTitle , setCollectionTitle] = useState('');
    let [collectionCategory , setCollectionCategory] = useState(''); 
    let [collectionAuthor , setCollectionAuthor] = useState('');
    let [errorMessage, setErrorMessage] = useState('');
    let [showSettings, setShowSettings] = useState(false);
    let [currentCollection, setCurrentCollection] = useState(undefined as Collections | undefined);


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

    function sendGameSettings()
    {
          const gamesRef = firestore.collection(db , "games");

          firestore.addDoc(gamesRef , props.currentGameSettings_);
    }


    function displayQuestions(e : any) { 
        
       console.log("pressed");
         

           if(collectionQLVisible === false){

                   console.log(" on");
                collectionQLVisible = true;
                showQuestionListText = "Preview";
                targetCollectionQuestionsList = currentCollection?.questionList;
                props.setSelectedCollection(currentCollection);
           
           }else{
            console.log(" off ");
            if(currentCollection)
             currentCollection.questionList = [];

                collectionQLVisible = false;
                showQuestionListText = "-";  
             
                
                targetCollectionQuestionsList = currentCollection?.questionList;
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
                let maxPlayers: Number = 2;
                let matchTimer : Number = 30;
                let collection : Collections = currentCollection as Collections;
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
                let maxPlayers: Number = 2;
                let matchTimer : Number = 30;
                let collection : Collections = currentCollection as Collections;
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
    
    
    return(
        !props.currentUser ? <Redirect to="/login"/> :
        <>
        
             <div>
                {/* prints all user collections to the screen */}

                <Table  striped bordered hover variant="dark">
                    <thead>
                        <tr>
                          <td>Collection Title</td>
                          <td>Collection Category</td>
                          <td>Collection Description</td>
                          <td>Author</td>
                          <td>Size</td>
                          <td>  {/* sets target collection to users collection */} <Button variant="secondary" id="show-collections-btn" className="btn btn-primary" onClick={getCollection}>{`${showCollectionText.toString()}`}</Button></td>
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
                                             <td> <Button variant="success" key={i} onClick={(e) => selectCollection( e , i)}> Select</Button></td>
                                            </tr> 
                                      })}
                     {/* ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++=+ */} 
                     
                     <tr>
                          <td><h5>*Favorites*</h5></td>
                          <td>+</td>
                          <td>+</td>
                          <td>+</td>
                          <td>Size</td>
                          <td>  {/* sets target collection to users collection */} <Button variant="secondary" id="show-collections-btn" className="btn btn-primary" onClick={getFavoriteCollections}>{`${showFavCollectionText.toString()}`}</Button></td>
                    </tr>
                   
                        {targetsFavoriteCollections?.map((C : Collections | undefined , i ) =>{
                           return  <tr key={i} >
                                             <td>{C?.title} </td>
                                             <td>{C?.category}</td>
                                             <td>{C?.description}</td>
                                             <td>{C?.author.username.toString()}</td>
                                             <td>{C?.questionList.length.toString()}</td>
                                             <td> <Button variant="success" key={i} onClick={(e) => selectFavoriteCollection( e , i)}> Select</Button></td>
                                            </tr> 
                                      })}
                     {/* ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++=+ */}

                    </tbody>
                </Table >
               

                <table>
                    <tbody>
                        <tr>
                            <td>
                            <Card style={{ width: '22rem' }} className="bg-dark text-white" >
                            <Card.Body>
                                <Card.Title>Game Manager</Card.Title>
                                
                                
                                <Card.Text>
                                  Set up your game
                                </Card.Text>
                                <Button variant="success" onClick={displayModal}>Game Settings</Button>
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
                                     <Link to="/game" className="btn btn-success" onClick={sendGameSettings} >Start Game</Link>
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
                                <Button variant="success" onClick={displayQuestions} >{showQuestionListText.toString()}</Button>
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
                { errorMessage ? <ErrorMessageComponent errorMessage={errorMessage}/> : <></> }
            </div>
        </>
    )
}

export default CustomGameComponent;