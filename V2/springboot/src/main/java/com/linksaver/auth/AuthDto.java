package com.linksaver.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthDto {

    public static class RegisterRequest {
        @NotBlank @Email
        public String email;

        @NotBlank @Size(min = 6)
        public String password;

        public String firstName;
        public String lastName;
    }

    public static class LoginRequest {
        @NotBlank @Email
        public String email;

        @NotBlank
        public String password;
    }

    public static class AuthResponse {
        public String token;
        public UserInfo user;

        public AuthResponse(String token, String id, String email, String firstName, String lastName) {
            this.token = token;
            this.user = new UserInfo(id, email, firstName, lastName);
        }
    }

    public static class UserInfo {
        public String id;
        public String email;
        public String firstName;
        public String lastName;

        public UserInfo(String id, String email, String firstName, String lastName) {
            this.id = id;
            this.email = email;
            this.firstName = firstName;
            this.lastName = lastName;
        }
    }
}
