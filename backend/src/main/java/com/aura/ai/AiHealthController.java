package com.aura.ai;
import java.util.Map;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/v1/ai")
public class AiHealthController {
  private final AiHealthClient client;
  public AiHealthController(AiHealthClient client) { this.client = client; }
  @GetMapping("/health") public Map<String,Object> health() { return client.health(); }
}
