import { Principal } from "../dtos/principal";
import { Redirect , Link } from "react-router-dom";
import {Card, Table} from "react-bootstrap"
import { Button, FormControl, Input, InputLabel, makeStyles, Typography} from "@material-ui/core";


interface IDashboardProps {
    currentUser: Principal | undefined;
}
const linkStyle = {
    backgroundColor: '#5f2568',
    border: '#5f2568',
    color: "gold",
  };

const useStyles = makeStyles({
    HomeContainer: {
        backgroundColor: "black",
        opacity: .94,
        justifyContent: "center",
        marginLeft: "10rem",
        marginTop: "5rem",
        padding: 250,
        width: "75%",
        borderRadius: "8em",
        border: "white",
    },
     welcome: {
        color: ' #FFD93D',
        alignContent: "center",
    }
});

function DashboardComponent(props: IDashboardProps) {
    const classes = useStyles();
    
    return (
        props.currentUser
        ?
        <>
            <div id = "home-component" className={classes.HomeContainer}>
            <h1 className = {classes.welcome}>Welcome {props.currentUser.username}!</h1>
            <br/><br/>
                <Card style={{ width: '45rem' , backgroundColor:'white' }} className="text-center">

                <Card.Header as="h5" >
                    Here you can find a number of statistics pertaining to your account!
                    <Card.Title> 
                    <br></br>
                    
                    </Card.Title>
                </Card.Header>
                <Card.Body >
                    <Card.Body id="div-for-question"  style={{ backgroundColor:'black' , color : 'grey'}}>
                        <br></br>
                        <br></br>
                        <br></br>
                        <br></br>
                        <h3 >
                           <Table striped bordered hover variant="dark">
                           <thead>
                            <tr>
                                <td><h5 color="yellow">Wins</h5></td>
                                <td><h5 color="yellow">Losses</h5></td>
                                <td><h5 color="yellow">Ties</h5></td>
                                <td><h5 color="yellow">KDR</h5></td>
                            </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><h6 color="brown">Insert Wins Here</h6></td>
                                    <td><h6 color="brown">Insert Losses Here</h6></td>
                                    <td><h6 color="brown">Insert Ties Here</h6></td>
                                    <td><h6 color="brown">Insert KDR Here</h6></td>
                                </tr>
                            </tbody>
                           </Table>
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
            <br/><br/>
            </div>
        </>
        :
        <Redirect to="/splash"/>
    )
}

export default DashboardComponent;