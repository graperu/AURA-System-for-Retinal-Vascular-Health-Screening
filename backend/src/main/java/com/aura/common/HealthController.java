package com.aura.common;
import com.aura.common.response.HealthResponse;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/v1")
public class HealthController {
  @GetMapping("/health") public HealthResponse health() { return new HealthResponse("aura-backend", "UP"); }
}
