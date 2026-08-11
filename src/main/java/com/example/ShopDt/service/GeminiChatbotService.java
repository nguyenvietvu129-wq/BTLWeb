package com.example.ShopDt.service;

import com.example.ShopDt.dto.response.ChatbotResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class GeminiChatbotService {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${gemini.apiKey}")
    private String apiKey;

    @Value("${gemini.model:gemini-3.6-flash}")
    private String model;

    @Value("${gemini.apiUrl:https://generativelanguage.googleapis.com/v1/interactions}")
    private String apiUrl;


    /**
     * Gửi câu hỏi của người dùng tới Gemini.
     */
    public ChatbotResponse chat(String userMessage) {

    String trimmed = userMessage == null
            ? ""
            : userMessage.trim();

    if (trimmed.isEmpty()) {
        return ChatbotResponse.builder()
                .reply("Bạn hãy nhập câu hỏi để tôi hỗ trợ nhé.")
                .build();
    }

    // Giới hạn input
    if (trimmed.length() > 1200) {
        trimmed = trimmed.substring(0, 1200);
    }

    String systemPrompt =
            "Bạn là trợ lý tư vấn bán linh kiện điện tử tại website Kho Linh Kiện. "
            + "Trả lời bằng tiếng Việt, lịch sự, ngắn gọn và thực tế. "
            + "Nếu người dùng hỏi về sản phẩm, hãy gợi ý nhu cầu và khuyến nghị cách chọn. "
            + "Nếu không đủ thông tin, hãy hỏi thêm 1-2 câu làm rõ.";

    String prompt = systemPrompt + "\n\nCâu hỏi của khách hàng:\n" + trimmed;

    /*
     * Interactions API:
     *
     * {
     *   "model": "gemini-3.6-flash",
     *   "input": "..."
     * }
     */
    Map<String, Object> requestBody = Map.of(
            "model", model,
            "input", prompt
    );

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);

    // API key truyền qua header
    headers.set("x-goog-api-key", apiKey);

    HttpEntity<Map<String, Object>> entity =
            new HttpEntity<>(requestBody, headers);

    RestTemplate restTemplate = new RestTemplate();

    restTemplate.setRequestFactory(
            clientHttpRequestFactoryWithTimeout(
                    Duration.ofSeconds(30)
            )
    );

    try {

        System.out.println("========== GEMINI REQUEST ==========");
        System.out.println("API URL: " + apiUrl);
        System.out.println("Model: " + model);
        System.out.println("API key exists: "
                + (apiKey != null && !apiKey.isBlank()));
        System.out.println("====================================");

        ResponseEntity<String> response =
                restTemplate.postForEntity(
                        apiUrl,
                        entity,
                        String.class
                );

        System.out.println("========== GEMINI RESPONSE ==========");
        System.out.println("HTTP Status: " + response.getStatusCode());
        System.out.println("Body: " + response.getBody());
        System.out.println("=====================================");

        if (!response.getStatusCode().is2xxSuccessful()
                || response.getBody() == null) {

            throw new RuntimeException(
                    "Gemini API call failed: "
                            + response.getStatusCode()
            );
        }

        String reply = extractReply(response.getBody());

        return ChatbotResponse.builder()
                .reply(reply)
                .build();

    } catch (Exception e) {

        System.err.println("========== GEMINI API ERROR ==========");
        System.err.println(e.getMessage());
        System.err.println("======================================");

        throw new RuntimeException(
                "Không thể kết nối Gemini API",
                e
        );
    }
}
    /**
     * Parse response từ Gemini Interactions API.
     *
     * Response dạng:
     *
     * {
     *   "id": "...",
     *   "steps": [
     *      {
     *        "type": "model_output",
     *        "content": [
     *          {
     *             "type": "text",
     *             "text": "..."
     *          }
     *        ]
     *      }
     *   ]
     * }
     */
    private String extractReply(String body) {

    try {

        JsonNode root = objectMapper.readTree(body);

        /*
         * Response mới:
         *
         * {
         *   "id": "...",
         *   "steps": [
         *     {
         *       "type": "model_output",
         *       "content": [
         *         {
         *           "type": "text",
         *           "text": "..."
         *         }
         *       ]
         *     }
         *   ]
         * }
         */

        JsonNode steps = root.path("steps");

        if (steps.isArray()) {

            for (JsonNode step : steps) {

                if ("model_output".equals(
                        step.path("type").asText())) {

                    JsonNode content = step.path("content");

                    if (content.isArray()) {

                        for (JsonNode item : content) {

                            if ("text".equals(
                                    item.path("type").asText())) {

                                String text =
                                        item.path("text").asText();

                                if (!text.isBlank()) {

                                    if (text.length() > 2500) {
                                        text = text.substring(0, 2500);
                                    }

                                    return text;
                                }
                            }
                        }
                    }
                }
            }
        }

        return "Xin lỗi, tôi chưa thể tạo câu trả lời lúc này.";

    } catch (Exception e) {

        throw new RuntimeException(
                "Không parse được response từ Gemini",
                e
        );
    }
}
    /**
     * Giới hạn độ dài câu trả lời chatbot.
     */
    private String limitReply(String text) {

        if (text == null || text.isBlank()) {

            return "Xin lỗi, tôi chưa thể tạo "
                    + "câu trả lời lúc này.";
        }


        if (text.length() > 2500) {

            return text.substring(
                    0,
                    2500
            );
        }


        return text;
    }


    /**
     * Cấu hình timeout cho RestTemplate.
     */
    private org.springframework.http.client.ClientHttpRequestFactory
    clientHttpRequestFactoryWithTimeout(
            Duration timeout
    ) {

        org.springframework.http.client.SimpleClientHttpRequestFactory
                factory =
                new org.springframework.http.client
                        .SimpleClientHttpRequestFactory();

        factory.setConnectTimeout(
                (int) timeout.toMillis()
        );

        factory.setReadTimeout(
                (int) timeout.toMillis()
        );

        return factory;
    }
}