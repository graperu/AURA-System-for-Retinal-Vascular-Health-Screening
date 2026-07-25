package com.aura;
import java.util.Map;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/v1")
class HealthController { @GetMapping("/health") Map<String,String> health(){ return Map.of("service","aura-backend","status","UP"); } }
