package com.revature.delete_card.Execptions;

public class InvalideRequestException extends RuntimeException {
    public InvalideRequestException( String message ) {
        super(message);
    }
}
