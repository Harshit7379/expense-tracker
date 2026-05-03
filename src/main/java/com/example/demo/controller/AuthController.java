package com.example.demo.controller;

import com.example.demo.util.JwtUtil;
import com.example.demo.entity.User;
import com.example.demo.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @PostMapping("/login")
public String login(@RequestBody User loginRequest) {

    return userService.findByEmail(loginRequest.getEmail())
            .map(user -> {
                if (new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder()
                        .matches(loginRequest.getPassword(), user.getPassword())) {

                    return jwtUtil.generateToken(user.getEmail());

                } else {
                    return "Invalid Password ❌";
                }
            })
            .orElse("User Not Found ❌");
}



    private final UserService userService;
    private final JwtUtil jwtUtil;

    public AuthController(UserService userService,JwtUtil jwtUtil) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        System.out.println("API HIT ");
    System.out.println("Name: " + user.getName());
        System.out.println(user.getEmail()); 

        if (userService.findByEmail(user.getEmail()).isPresent()) {
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body("Email already registered");
        }

        return ResponseEntity.ok(userService.registerUser(user));
    }
}
