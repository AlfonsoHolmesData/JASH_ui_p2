import {Principal} from "../../dtos/principal";
import {useState, useEffect} from "react";
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal'
import { Question } from "../../dtos/question";
import { Collections } from "../../dtos/collection";
import {createQuestion} from "../../remote/question-service";
import ErrorMessageComponent from "../ErrorMessageComponent";
import { ButtonGroup, Dropdown, DropdownButton } from "react-bootstrap";
import { create } from "domain";
import { async } from "@firebase/util";

interface IQuestionModal {
    current_user: Principal | undefined;
    current_collection: Collections | undefined;
    show: boolean;
    setShow: (val: boolean) => void
    updateUI: (question: Question | undefined) => void
}

function CreateQuestionModal(props: IQuestionModal) {
    let [question , setQuestion] = useState({question:"", collection_id: props.current_collection?.id, answer:"", category:"", value:""} as Question | undefined);
    let [errorMessage, setErrorMessage] = useState('');

    const handleClose = () => {
      props.setShow(false);
    }

    const create = async() => {
        if(props.current_user) {
            console.log("Creating")

            if(question) {
                try {
                    question = await createQuestion(question, props.current_user.token);
                } catch(e : any) {
                    setErrorMessage(e.message);
                    return
                }

                props.updateUI(question);
                handleClose();

            }
          }
    }

    function updateQuestion(e : any) {
        let temp = question;
        if(temp) {
          temp.question = e.currentTarget.value;
        }
        setQuestion(temp);
    }

    function updateCategory(e : any , key : Number) {
      let temp = question;
      if(temp) {
        if(key === 1)
        temp.category = "Entertainment";
        else if(key === 2)
        temp.category = "Education";
        else if(key === 3)
        temp.category = "Food";
        else if(key === 4)
        temp.category = "Love";
        else
        temp.category = "Misc";
      }
      setQuestion(temp);
    }

    function updateAnswer(e : any) {
      let temp = question;
        if(temp) {
          temp.answer = e.currentTarget.value;
        }
        setQuestion(temp);
    }

    function updateDifficulty(e : any , key : Number) {
      let temp = question;
      if(temp) {
        if(key === 1)
        temp.category = "1";
        else if(key === 2)
        temp.category = "2";
        else if(key === 3)
        temp.category = "3";
        else if(key === 4)
        temp.category = "4";
      }
          setQuestion(temp);
      }

    return (
        <>
          <Modal show={props.show} onHide={handleClose}>
            <Modal.Header closeButton>
              <Modal.Title>Create New Question</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <input id="question-input" type="text" onChange={updateQuestion} placeholder="Question"/>
              <br/><br/>
              <input id="answer-input" type="text" onChange={updateAnswer} placeholder="Answer"/>
              <br/><br/>
              <p>Difficulty:</p>
              <DropdownButton as={ButtonGroup} key={1} id={`dropdown-variants-primary`} variant="primary" title= {question?.value}>
              <Dropdown.Item eventKey="1"  onClick={(e) => updateDifficulty(e , 1)}>Easy</Dropdown.Item>
                <Dropdown.Item eventKey="2"  onClick={(e) => updateDifficulty(e , 2)}>Medium</Dropdown.Item>
                <Dropdown.Item eventKey="3"  onClick={(e) => updateDifficulty(e , 3)}>Hard</Dropdown.Item>
                <Dropdown.Item eventKey="4"  onClick={(e) => updateDifficulty(e , 4)}>Extreme</Dropdown.Item>
              </DropdownButton>
              <br/><br/>
              { errorMessage ? <ErrorMessageComponent errorMessage={errorMessage}/> : <></> }
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleClose}>
                Cancel
              </Button>
              <Button variant="primary" onClick={create}>
                Create
              </Button>
            </Modal.Footer>
          </Modal>
        </>
      );
}
export default CreateQuestionModal;