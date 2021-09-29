package com.revature.delete_card.Repositories;

import com.revature.delete_card.Documents.Set;
import com.revature.delete_card.Documents.User;
import com.revature.delete_card.Execptions.ResourceNotFoundException;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Expression;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.ScanEnhancedRequest;
import software.amazon.awssdk.http.apache.ApacheHttpClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class UserRepository {
    private final DynamoDbTable<User> userTable;

    public UserRepository(){
        DynamoDbClient db = DynamoDbClient.builder().httpClient(ApacheHttpClient.create()).build();
        DynamoDbEnhancedClient dbClient = DynamoDbEnhancedClient.builder().dynamoDbClient(db).build();
        userTable = dbClient.table("Users", TableSchema.fromBean(User.class));
    }

    /**
     * Gets all users from the Users table
     * @Authors Alfonso Holmes
     */
    public List<User> getAllUsers(){ return userTable.scan().items().stream().collect(Collectors.toList()); }

    /**
     * Gets a given user from the Users table by username
     * @Authors Alfonso Holmes
     * @param name
     */
    public User getUser(String name) {
        AttributeValue val = AttributeValue.builder().s(name).build();
        Expression filter = Expression.builder().expression("#a = :b").putExpressionName("#a", "username") .putExpressionValue(":b", val).build();
        ScanEnhancedRequest request = ScanEnhancedRequest.builder().filterExpression(filter).build();
        User user = userTable.scan(request).stream().findFirst().orElseThrow(ResourceNotFoundException::new).items().get(0);
        System.out.println("USER WITH ID: " + user);
        return user;
    }

    /**
     * Handles referential integrity by removing the given updated set from all users created_sets and favorited_sets lists
     * @Authors  Alfonso Holmes
     * @param updated_set
     */

    public void updateUserCollections(Set updated_set) {
        //get rid of set from author's created_sets and all users favorite_sets
        List<User> users = getAllUsers();
        for(User u : users) {

            /*
                 * iterating thought users created sets
                 * searching for the created user set that matched the updated_set id
                 * replacing target sets card array with the updated one
            */
            for (User.UserSetDoc set : u.getCreated_sets()) {
                if (set.getId().equals(updated_set.getId())) {
                    set.setCards(updated_set.getCards());
                }
            }

            /*
             * iterating thought users created sets
             * searching for the favorited user set that matched the updated_set id
             * replacing target sets card array with the updated one
             */
            for (User.UserSetDoc set : u.getFavorite_sets()) {
                if (set.getId().equals(updated_set.getId())) {
                    set.setCards(updated_set.getCards());
                }
            }

            userTable.putItem(u);
        }
    }
}