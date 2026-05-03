package com.example.demo.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HomeController {

    @GetMapping("/")
    public String home() {
        return "Login Successful 🚀 Application Running";
    }

    @GetMapping("/profile")
    public String profile() {
    return "This is protected profile data 🔐";
}

}

