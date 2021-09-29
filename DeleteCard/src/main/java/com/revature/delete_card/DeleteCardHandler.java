package com.revature.delete_card;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.LambdaLogger;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.revature.delete_card.Documents.Set;
import com.revature.delete_card.Execptions.ResourceNotFoundException;
import com.revature.delete_card.Repositories.SetRepository;
import com.revature.delete_card.Repositories.UserRepository;

public class DeleteCardHandler implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {

private final SetRepository setRepo;
private final UserRepository userRepo;
private static final Gson mapper = new GsonBuilder().setPrettyPrinting().create();

public DeleteCardHandler() {
        this.setRepo = new SetRepository();
        this.userRepo = new UserRepository();
        }

public DeleteCardHandler(SetRepository setRepo, UserRepository userRepo) {
        this.setRepo = setRepo;
        this.userRepo = userRepo;
        }

/**
 * Handles a DELETE request to the /sets/id endpoint
 * @Authors Alfonso Holmes
 * @param requestEvent
 * @param context
 * @return
 */
@Override
public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent requestEvent, Context context) {

        LambdaLogger logger = context.getLogger();
        logger.log("RECEIVED EVENT: " + requestEvent);

        APIGatewayProxyResponseEvent responseEvent = new APIGatewayProxyResponseEvent();
        //getting id out of request body
        String target_id = requestEvent.getPathParameters().get("id");
        String card_id = requestEvent.getPathParameters().get("card_id");
        // attempting to delete target set based on id
        try{
        // deleting card from Sets table
        Set updated_set = setRepo.deleteCardBySetId(target_id , card_id);
        // using updated set from table to update the rest of users
        userRepo.updateUserCollections(updated_set);
        responseEvent.setBody(mapper.toJson(updated_set));
        }catch (ResourceNotFoundException rnfe) {
        responseEvent.setStatusCode(404);
        }


        responseEvent.setStatusCode(200);
        return responseEvent;
        }
}
