package com.aura;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

@SpringBootApplication
@EnableScheduling
public class AuraApplication {

  public static void main(String[] args) {
    loadDotEnv();
    SpringApplication.run(AuraApplication.class, args);
  }

  private static void loadDotEnv() {
    Path[] candidatePaths = new Path[]{
        Path.of(".env"),
        Path.of("backend", ".env"),
        Path.of("..", ".env"),
        Path.of("..", "backend", ".env")
    };

    for (Path path : candidatePaths) {
      if (Files.exists(path) && Files.isRegularFile(path)) {
        try {
          List<String> lines = Files.readAllLines(path);
          for (String line : lines) {
            line = line.trim();
            if (line.isEmpty() || line.startsWith("#")) {
              continue;
            }
            int eqIdx = line.indexOf('=');
            if (eqIdx > 0) {
              String key = line.substring(0, eqIdx).trim();
              String val = line.substring(eqIdx + 1).trim();
              if (System.getProperty(key) == null && System.getenv(key) == null) {
                System.setProperty(key, val);
              }
            }
          }
        } catch (Exception ignored) {
        }
      }
    }
  }
}
