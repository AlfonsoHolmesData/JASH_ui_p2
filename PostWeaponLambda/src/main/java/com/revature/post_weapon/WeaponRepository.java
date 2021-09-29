package com.revature.post_weapon;

import com.amazonaws.services.dynamodbv2.AmazonDynamoDBClientBuilder;
import com.amazonaws.services.dynamodbv2.datamodeling.DynamoDBMapper;
import com.amazonaws.services.dynamodbv2.datamodeling.DynamoDBSaveExpression;

public class WeaponRepository {
    private final DynamoDBMapper dbReader;

    public WeaponRepository() {
        dbReader = new DynamoDBMapper(AmazonDynamoDBClientBuilder.defaultClient());
    }


    public void createWeapon(Weapon weapon) {

        dbReader.save(weapon, new DynamoDBSaveExpression());

    }
}
