package com.revature.delete_card.Repositories;

import com.revature.delete_card.Documents.Card;
import com.revature.delete_card.Documents.Set;
import com.revature.delete_card.Execptions.ResourceNotFoundException;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.http.apache.ApacheHttpClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class SetRepository {
    private final DynamoDbTable<Set> setTable;

    public SetRepository() {
        DynamoDbClient db = DynamoDbClient.builder().httpClient(ApacheHttpClient.create()).build();
        DynamoDbEnhancedClient dbClient = DynamoDbEnhancedClient.builder().dynamoDbClient(db).build();
        setTable = dbClient.table("Sets", TableSchema.fromBean(Set.class));
    }

    /**
     * Deletes a card from the target Set by id
     *
     * @param id
     * @Authors Alfonso Holmes.
     */
    public Set deleteCardBySetId(String id , String card_id) {
        // 1) creating new set_document for query
        Set s = new Set();
        s.setId(id);

        // 2) getting target set from table
        Set target_set = setTable.getItem(s);
        System.out.println(target_set);

        // 3) throw exception if the target set is null
        if(target_set == null)
        {
            throw new ResourceNotFoundException();
        }

        //------------------------------------------------------------------------------------
        /*  4)
            * streaming through and excluding cards with matching ids
            * inserting resultant list back into target_set
         */
        List<Card> valid_cards_list = target_set.getCards().stream().filter(c -> c.getId() != card_id).collect(Collectors.toList());
        target_set.setCards(valid_cards_list);
        //------------------------------------------------------------------------------------

        // 5) returning updated set to the database
        setTable.putItem(target_set);
        // 6) returning target_set to use it for referential integrity
        return target_set;

    }
}