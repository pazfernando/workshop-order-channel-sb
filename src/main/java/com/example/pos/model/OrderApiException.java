package com.example.pos.model;

public class OrderApiException extends RuntimeException {

    private final int statusCode;
    private final String responseBody;

    public OrderApiException(int statusCode, String responseBody) {
        super("Order API failed with status " + statusCode);
        this.statusCode = statusCode;
        this.responseBody = responseBody;
    }

    public int getStatusCode() {
        return statusCode;
    }

    public String getResponseBody() {
        return responseBody;
    }
}
