import { Principal } from "../dtos/principal";
import { Collections } from "../dtos/collection";
import { Question } from "../dtos/question";
import { Redirect , Link } from "react-router-dom";
import {useState, useEffect} from "react";
import {getCollection} from "../remote/collection-service";
import Table from 'react-bootstrap/Table'
import Button from 'react-bootstrap/Button'

import DeleteQuestionModal from "./question-modals/DeleteQuestionModal";
import CreateQuestionModal from "./question-modals/CreateQuestionModal";
import EditQuestionModal from "./question-modals/EditQuestionModal";




interface IViewProps {
    currentUser: Principal | undefined;
    collection: Collections | undefined;
    setCollection: (nextCollection: Collections | undefined) => void
}
const buttonStyle = {
    backgroundColor: 'black',
    border: 'black',
    color: "gold",
  }

function ViewCollectionComponent(props: IViewProps) {
    let [questions , setQuestions] = useState([] as Question[]);
    let [hasCollection, setHasCollection] = useState(false);
    let [showDelete, setShowDelete] = useState(false);
    let [showCreate, setShowCreate] = useState(false);
    let [showEdit, setShowEdit] = useState(false);
    let [errorMessage, setErrorMessage] = useState('');
    let [currentQuestion, setCurrentQuestion] = useState(undefined as Question | undefined);

    useEffect(() => {
        if(!hasCollection) {
            getCollectionWrapper();
        }
    })

    async function getCollectionWrapper() {    
        try {   
            if(props.currentUser) {
                setHasCollection(true);
                //@ts-ignore
                let collection_id = props.collection?.id
                let temp = undefined
                if(collection_id) {
                    temp = await getCollection( collection_id, props.currentUser.token );
                } else {
                    console.log("NO ID")
                }

                if(temp) {
                    props.setCollection(temp);
                    setQuestions(temp.questionList);
                } else {
                    return;
                }
                console.log(props.collection)
            }

        } catch (e: any) {
            setErrorMessage(e.message); 
        }   
    }

    function edit(question : Question | undefined) {
        if(!question) {
            return;
        }

        setShowEdit(true);
        setCurrentQuestion(question);
        return undefined;
    }

    function editUI(question : Question | undefined) {
        if(!question) {
            return;
        }
        let temp = questions;
        temp.forEach((q:Question) => {
            if(q.id === question.id) {
                q.answer = question.answer;
                q.question = question.question;
                q.category = question.category;
                q.value = question.value;
            }
        })
        setQuestions(temp);
    }

    function remove(question : Question | undefined) {
        if(!question) {
            return;
        }

        setShowDelete(true);
        setCurrentQuestion(question);

        return undefined;
    }

    function removeUI(question : Question | undefined) {
        if(!question) {
            return;
        }
        
        console.log(question.id)
        let temp = questions;
        temp = temp.filter((q : Question) => {
            return !(q.id === question.id)
        })
        console.log(temp);
        setQuestions(temp);
    }

    async function create() {
        setShowCreate(true);
        return undefined;
    }

    function createUI(question : Question | undefined) {
        if(!question) {
            return;
        }

        let temp = questions;
        temp.push(question);
        console.log(temp);
        setQuestions(temp);
    }

    function getComponent() {
        if(showDelete) {
            return <DeleteQuestionModal current_user={props.currentUser} question={currentQuestion} show={showDelete} setShow={setShowDelete} updateUI={removeUI}/>;
        } else if(showCreate) {
            return <CreateQuestionModal current_user={props.currentUser} current_collection={props.collection} show={showCreate} setShow={setShowCreate} updateUI={createUI}/>;
        } else if(showEdit){
            return <EditQuestionModal current_user={props.currentUser} current_collection={props.collection} question={currentQuestion} show={showEdit} setShow={setShowEdit} updateUI={editUI}/>;
        }
    }


    return (
        props.currentUser
        ?
        <>
            <h1 style = {{color: ' #FFD93D', marginLeft: '1em'}}>Manage "{props.collection?.title}" by {props.currentUser.username}</h1>
            <h6 style = {{color: ' #FFD93D', marginLeft: '3em'}}>Category: {props.collection?.category}</h6>
            <h6 style = {{color: ' #FFD93D', marginLeft: '3em'}}>Description: {props.collection?.description}</h6>
            <Table  striped bordered hover variant="dark">
                    <thead>
                        <tr>
                          <td>Question</td>
                          <td>Answer</td>
                          <td>Difficulty</td>
                          <td>Manage</td>
                        </tr>
                    </thead>
                    <tbody>
                    {questions.map((Q : Question | undefined, i) =>{
                           
                        return  <tr key={i}>
                                    <td>{Q?.question} </td>
                                    <td>{Q?.answer}</td>
                                    <td>{Q?.value}</td>
                                    
                                    <td>
                                    <Button style = {buttonStyle} variant="secondary" onClick={() => edit(Q)}>Edit</Button> {  }
                                    <Button  style = {buttonStyle}variant="secondary" onClick={() => remove(Q)}>Delete</Button> {  }
                                    </td>
                                </tr> 
                    })}
                    {getComponent()}
                    </tbody>
                </Table>
                <Button style = {buttonStyle} variant="secondary" onClick={create}>Create New Question</Button>
        </>
        :
        <Redirect to="/login"/>
    )
}

export default ViewCollectionComponent;