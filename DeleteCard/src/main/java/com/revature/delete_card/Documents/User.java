package com.revature.delete_card.Documents;


import lombok.Data;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;

import java.util.List;

@Data
@DynamoDbBean
public class User {

    private String id;
    private String username;
    private String profile_picture;
    private int points;
    private int wins;
    private int losses;
    private String registration_date;
    private List<String> gameRecords;
    private List<UserSetDoc> created_sets;
    private List<UserSetDoc> favorite_sets;

    @DynamoDbPartitionKey
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getProfile_picture() {
        return profile_picture;
    }

    public void setProfile_picture(String profile_picture) {
        this.profile_picture = profile_picture;
    }

    public int getPoints() {
        return points;
    }

    public void setPoints(int points) {
        this.points = points;
    }

    public int getWins() {
        return wins;
    }

    public void setWins(int wins) {
        this.wins = wins;
    }

    public int getLosses() {
        return losses;
    }

    public void setLosses(int losses) {
        this.losses = losses;
    }

    public String getRegistration_date() {
        return registration_date;
    }

    public void setRegistration_date(String registration_date) {
        this.registration_date = registration_date;
    }

    public List<String> getGameRecords() {
        return gameRecords;
    }

    public void setGameRecords(List<String> gameRecords) {
        this.gameRecords = gameRecords;
    }

    public List<UserSetDoc> getCreated_sets() {
        return created_sets;
    }

    public void setCreated_sets(List<UserSetDoc> created_sets) {
        this.created_sets = created_sets;
    }

    public List<UserSetDoc> getFavorite_sets() {
        return favorite_sets;
    }

    public void setFavorite_sets(List<UserSetDoc> favorite_sets) {
        this.favorite_sets = favorite_sets;
    }

    //This class represents the fields of a Set that the User Document cares about storing
    @Data
    @DynamoDbBean
    public static class UserSetDoc{
        private String id;
        private String set_name;
        private List<Tag> tags;
        private List<Card> cards;
        private String author;
        private boolean is_public;
        private int views = 0;
        private int plays = 0;
        private int studies = 0;
        private int favorites = 0;

        public UserSetDoc(Set set) {
            id = set.getId();
            set_name = set.getSet_name();
            tags = set.getTags();
            author = set.getAuthor();
            is_public = set.is_public();
        }

        public UserSetDoc() {
            super();
        }
    }


}
