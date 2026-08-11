package com.example.ShopDt.controller;

import com.example.ShopDt.dto.request.ChatbotRequest;
import com.example.ShopDt.dto.response.ApiResponse;
import com.example.ShopDt.dto.response.ChatbotResponse;
import com.example.ShopDt.service.GeminiChatbotService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ChatbotController {

    private final GeminiChatbotService geminiChatbotService;

    @PostMapping("/chatbot")
    public ResponseEntity<ApiResponse<ChatbotResponse>> chat(
            @Valid @RequestBody ChatbotRequest request
    ) {
        ChatbotResponse reply = geminiChatbotService.chat(request.getMessage());
        return ResponseEntity.ok(ApiResponse.success(reply, "OK"));
    }
}

