package com.revature.delete_set;

import com.amazonaws.services.dynamodbv2.datamodeling.DynamoDBAttribute;
import com.amazonaws.services.dynamodbv2.datamodeling.DynamoDBTable;
import lombok.Data;


@Data
@DynamoDBTable(tableName = "Tags")
public class Tag {

//    @DynamoDBHashKey

    @DynamoDBAttribute
    private String tag_name;

    @DynamoDBAttribute
    private String tag_color;
}
