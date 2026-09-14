package com.aura.config;

import com.aura.auth.security.AuraUserPrincipal;
import com.aura.auth.security.JwtTokenProvider;
import io.jsonwebtoken.Claims;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

  private static final Logger log = LoggerFactory.getLogger(WebSocketConfig.class);

  @Value("${app.cors.allowed-origins:http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173}")
  private String[] allowedOrigins;

  @Autowired(required = false)
  private JwtTokenProvider jwtTokenProvider;

  @Override
  public void configureMessageBroker(MessageBrokerRegistry config) {
    config.enableSimpleBroker("/topic", "/queue");
    config.setApplicationDestinationPrefixes("/app");
    config.setUserDestinationPrefix("/user");
  }

  @Override
  public void registerStompEndpoints(StompEndpointRegistry registry) {
    registry.addEndpoint("/ws-aura")
        .setAllowedOriginPatterns(allowedOrigins)
        .withSockJS();

    registry.addEndpoint("/ws-aura-raw")
        .setAllowedOriginPatterns(allowedOrigins);
  }

  @Override
  public void configureClientInboundChannel(ChannelRegistration registration) {
    registration.interceptors(new ChannelInterceptor() {
      @Override
      public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) {
          return message;
        }

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
          String authHeader = accessor.getFirstNativeHeader("Authorization");
          if (authHeader != null && authHeader.startsWith("Bearer ") && jwtTokenProvider != null) {
            String token = authHeader.substring(7).trim();
            try {
              Claims claims = jwtTokenProvider.parse(token);
              UUID id = UUID.fromString(claims.getSubject());
              @SuppressWarnings("unchecked")
              List<String> roles = claims.get("roles", List.class);
              AuraUserPrincipal principal = new AuraUserPrincipal(
                  id, id.toString(), "", true, roles != null ? roles : List.of());
              UsernamePasswordAuthenticationToken auth =
                  new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
              accessor.setUser(auth);
              log.debug("WebSocket STOMP authenticated for user: {}", id);
            } catch (Exception e) {
              log.warn("Invalid JWT in WebSocket CONNECT: {}", e.getMessage());
            }
          }
        } else if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
          String destination = accessor.getDestination();
          if (destination != null && destination.startsWith("/topic/chat.")) {
            String targetUserId = destination.substring("/topic/chat.".length());
            Object userObj = accessor.getUser();
            if (userObj instanceof UsernamePasswordAuthenticationToken auth
                && auth.getPrincipal() instanceof AuraUserPrincipal principal) {
              boolean isAdmin = principal.roles() != null && principal.roles().contains("ADMIN");
              if (!isAdmin && !principal.id().toString().equalsIgnoreCase(targetUserId)) {
                log.warn("Unauthorized subscription attempt to {} by user {}", destination, principal.id());
                throw new AccessDeniedException("Unauthorized subscription to private chat channel");
              }
            }
          }
        }

        return message;
      }
    });
  }
}
