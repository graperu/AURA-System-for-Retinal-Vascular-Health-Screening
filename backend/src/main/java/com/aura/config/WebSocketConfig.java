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
import org.springframework.security.core.GrantedAuthority;
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
          if (authHeader == null || !authHeader.startsWith("Bearer ") || jwtTokenProvider == null) {
            log.warn("WebSocket CONNECT rejected: Missing or invalid Authorization header");
            throw new AccessDeniedException("Yêu cầu JWT token hợp lệ trong header Authorization để kết nối WebSocket");
          }
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
            throw new AccessDeniedException("JWT token không hợp lệ hoặc đã hết hạn: " + e.getMessage());
          }
        } else if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
          String destination = accessor.getDestination();
          if (destination != null) {
            authorizeSubscription(destination, accessor);
          }
        }

        return message;
      }

      private void authorizeSubscription(String destination, StompHeaderAccessor accessor) {
        String normalized = destination;
        if (destination.startsWith("/topic/")) {
          normalized = "/topic/" + destination.substring(7).replace('/', '.');
        }

        boolean isRestrictedTopic = normalized.startsWith("/topic/chat.")
            || normalized.startsWith("/topic/notifications.")
            || normalized.startsWith("/topic/screening.")
            || normalized.startsWith("/topic/appointments.")
            || normalized.startsWith("/topic/clinic.")
            || normalized.startsWith("/topic/screening-chat.")
            || normalized.startsWith("/topic/doctor.")
            || normalized.startsWith("/topic/admin.")
            || normalized.startsWith("/topic/patient.");

        if (!isRestrictedTopic) {
          return;
        }

        Object userObj = accessor.getUser();
        if (!(userObj instanceof UsernamePasswordAuthenticationToken auth
            && auth.getPrincipal() instanceof AuraUserPrincipal principal)) {
          log.warn("Unauthenticated subscription attempt to {}", destination);
          throw new AccessDeniedException("Yêu cầu đăng nhập để đăng ký kênh thông tin thời gian thực: " + destination);
        }

        boolean isAdmin = hasRole(principal, "ADMIN");
        if (isAdmin) {
          return;
        }

        if (normalized.startsWith("/topic/admin.")) {
          log.warn("Unauthorized subscription to admin topic {} by user {}", destination, principal.id());
          throw new AccessDeniedException("Chỉ Quản trị viên mới có quyền đăng ký kênh thông báo quản trị");
        } else if (normalized.startsWith("/topic/doctor.")) {
          if (!hasRole(principal, "DOCTOR")) {
            log.warn("Unauthorized subscription to doctor topic {} by user {}", destination, principal.id());
            throw new AccessDeniedException("Chỉ Bác sĩ mới có quyền đăng ký kênh thông báo chuyên môn");
          }
        } else if (normalized.startsWith("/topic/patient.")) {
          String targetPatientId = normalized.substring("/topic/patient.".length());
          boolean isSelf = principal.id().toString().equalsIgnoreCase(targetPatientId);
          boolean isClinicalStaff = hasRole(principal, "DOCTOR") || hasRole(principal, "CLINIC");
          if (!isSelf && !isClinicalStaff) {
            log.warn("Unauthorized subscription to patient topic {} by user {}", destination, principal.id());
            throw new AccessDeniedException("Unauthorized subscription to patient channel");
          }
        } else if (normalized.startsWith("/topic/chat.")) {
          String targetUserId = normalized.substring("/topic/chat.".length());
          boolean isSelf = principal.id().toString().equalsIgnoreCase(targetUserId);
          boolean isDoctor = hasRole(principal, "DOCTOR");
          if (!isSelf && !isDoctor) {
            log.warn("Unauthorized subscription attempt to {} by user {}", destination, principal.id());
            throw new AccessDeniedException("Unauthorized subscription to private channel");
          }
        } else if (normalized.startsWith("/topic/notifications.")) {
          String targetUserId = normalized.substring("/topic/notifications.".length());
          boolean isSelf = principal.id().toString().equalsIgnoreCase(targetUserId);
          if (!isSelf) {
            log.warn("Unauthorized subscription attempt to {} by user {}", destination, principal.id());
            throw new AccessDeniedException("Unauthorized subscription to private channel");
          }
        } else if (normalized.startsWith("/topic/screening.")) {
          String patientId = normalized.substring("/topic/screening.".length());
          boolean isSelf = principal.id().toString().equalsIgnoreCase(patientId);
          boolean isClinicalStaff = hasRole(principal, "DOCTOR") || hasRole(principal, "CLINIC");
          if (!isSelf && !isClinicalStaff) {
            log.warn("Unauthorized subscription attempt to {} by user {}", destination, principal.id());
            throw new AccessDeniedException("Unauthorized subscription to screening channel");
          }
        } else if (normalized.startsWith("/topic/appointments.")) {
          String targetUserId = normalized.substring("/topic/appointments.".length());
          boolean isSelf = principal.id().toString().equalsIgnoreCase(targetUserId);
          boolean isClinicalStaff = hasRole(principal, "DOCTOR") || hasRole(principal, "CLINIC");
          if (!isSelf && !isClinicalStaff) {
            log.warn("Unauthorized subscription attempt to {} by user {}", destination, principal.id());
            throw new AccessDeniedException("Unauthorized subscription to appointments channel");
          }
        } else if (normalized.startsWith("/topic/clinic.")) {
          boolean isClinicOrDoctor = hasRole(principal, "CLINIC") || hasRole(principal, "DOCTOR");
          if (!isClinicOrDoctor) {
            log.warn("Unauthorized subscription attempt to {} by user {}", destination, principal.id());
            throw new AccessDeniedException("Unauthorized subscription to clinic channel");
          }
        } else if (normalized.startsWith("/topic/screening-chat.")) {
          boolean isAuthorized = hasRole(principal, "USER")
              || hasRole(principal, "PATIENT")
              || hasRole(principal, "DOCTOR")
              || hasRole(principal, "CLINIC");
          if (!isAuthorized) {
            log.warn("Unauthorized subscription attempt to {} by user {}", destination, principal.id());
            throw new AccessDeniedException("Unauthorized subscription to screening chat channel");
          }
        }
      }

      private boolean hasRole(AuraUserPrincipal principal, String role) {
        if (principal == null) {
          return false;
        }
        if (principal.roles() != null) {
          for (String r : principal.roles()) {
            if (r != null && (r.equalsIgnoreCase(role) || r.equalsIgnoreCase("ROLE_" + role))) {
              return true;
            }
          }
        }
        if (principal.getAuthorities() != null) {
          for (GrantedAuthority ga : principal.getAuthorities()) {
            if (ga != null && (ga.getAuthority().equalsIgnoreCase("ROLE_" + role) || ga.getAuthority().equalsIgnoreCase(role))) {
              return true;
            }
          }
        }
        return false;
      }
    });
  }
}
