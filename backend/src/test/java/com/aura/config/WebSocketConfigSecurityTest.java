package com.aura.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.aura.auth.security.AuraUserPrincipal;
import com.aura.auth.security.JwtTokenProvider;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.util.ReflectionTestUtils;

@DisplayName("WebSocketConfig Security Tests (BE-SEC-2 & BE-SEC-3)")
class WebSocketConfigSecurityTest {

  private WebSocketConfig webSocketConfig;
  private JwtTokenProvider jwtTokenProvider;
  private ChannelInterceptor interceptor;
  private MessageChannel messageChannel;

  @BeforeEach
  void setUp() {
    webSocketConfig = new WebSocketConfig();
    jwtTokenProvider = mock(JwtTokenProvider.class);
    ReflectionTestUtils.setField(webSocketConfig, "jwtTokenProvider", jwtTokenProvider);

    ChannelRegistration registration = new ChannelRegistration();
    webSocketConfig.configureClientInboundChannel(registration);

    @SuppressWarnings("unchecked")
    List<ChannelInterceptor> interceptors = (List<ChannelInterceptor>) ReflectionTestUtils.getField(registration, "interceptors");
    assertThat(interceptors).isNotEmpty();
    interceptor = interceptors.get(0);
    messageChannel = mock(MessageChannel.class);
  }

  @Test
  @DisplayName("CONNECT frame: Missing Authorization header is rejected with AccessDeniedException")
  void connect_missingAuthHeader_throwsAccessDenied() {
    StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
    Message<byte[]> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

    assertThatThrownBy(() -> interceptor.preSend(message, messageChannel))
        .isInstanceOf(AccessDeniedException.class)
        .hasMessageContaining("Yêu cầu JWT token hợp lệ");
  }

  @Test
  @DisplayName("CONNECT frame: Invalid JWT is rejected with AccessDeniedException")
  void connect_invalidJwt_throwsAccessDenied() {
    StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
    accessor.setNativeHeader("Authorization", "Bearer invalid.token.value");
    when(jwtTokenProvider.parse("invalid.token.value")).thenThrow(new JwtException("Signature invalid"));

    Message<byte[]> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

    assertThatThrownBy(() -> interceptor.preSend(message, messageChannel))
        .isInstanceOf(AccessDeniedException.class)
        .hasMessageContaining("JWT token không hợp lệ");
  }

  @Test
  @DisplayName("CONNECT frame: Valid JWT authenticates and sets principal")
  void connect_validJwt_authenticatesSuccessfully() {
    UUID userId = UUID.randomUUID();
    StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
    accessor.setLeaveMutable(true);
    accessor.setNativeHeader("Authorization", "Bearer valid.token.value");

    Claims claims = mock(Claims.class);
    when(claims.getSubject()).thenReturn(userId.toString());
    when(claims.get("roles", List.class)).thenReturn(List.of("DOCTOR"));
    when(jwtTokenProvider.parse("valid.token.value")).thenReturn(claims);

    Message<byte[]> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
    Message<?> result = interceptor.preSend(message, messageChannel);

    assertThat(result).isNotNull();
    StompHeaderAccessor resultAccessor = StompHeaderAccessor.wrap(result);
    assertThat(resultAccessor.getUser()).isNotNull();
  }

  @Test
  @DisplayName("SUBSCRIBE: Unauthenticated user subscribing to restricted topic is rejected")
  void subscribe_unauthenticated_throwsAccessDenied() {
    StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
    accessor.setDestination("/topic/doctor/scans");
    Message<byte[]> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

    assertThatThrownBy(() -> interceptor.preSend(message, messageChannel))
        .isInstanceOf(AccessDeniedException.class)
        .hasMessageContaining("Yêu cầu đăng nhập");
  }

  @Test
  @DisplayName("SUBSCRIBE: Non-admin user subscribing to /topic/admin/activity is rejected")
  void subscribe_adminTopic_nonAdmin_throwsAccessDenied() {
    UUID userId = UUID.randomUUID();
    AuraUserPrincipal principal = new AuraUserPrincipal(userId, "u@aura.ai", "p", true, List.of("DOCTOR"));
    UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());

    StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
    accessor.setDestination("/topic/admin/activity");
    accessor.setUser(auth);

    Message<byte[]> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

    assertThatThrownBy(() -> interceptor.preSend(message, messageChannel))
        .isInstanceOf(AccessDeniedException.class)
        .hasMessageContaining("Chỉ Quản trị viên mới có quyền");
  }

  @Test
  @DisplayName("SUBSCRIBE: Non-doctor user subscribing to /topic/doctor/scans is rejected")
  void subscribe_doctorTopic_nonDoctor_throwsAccessDenied() {
    UUID userId = UUID.randomUUID();
    AuraUserPrincipal principal = new AuraUserPrincipal(userId, "u@aura.ai", "p", true, List.of("USER"));
    UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());

    StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
    accessor.setDestination("/topic/doctor/scans");
    accessor.setUser(auth);

    Message<byte[]> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

    assertThatThrownBy(() -> interceptor.preSend(message, messageChannel))
        .isInstanceOf(AccessDeniedException.class)
        .hasMessageContaining("Chỉ Bác sĩ mới có quyền");
  }

  @Test
  @DisplayName("SUBSCRIBE: Patient subscribing to other patient's channel /topic/patient/{id} is rejected")
  void subscribe_patientTopic_differentPatient_throwsAccessDenied() {
    UUID patient1 = UUID.randomUUID();
    UUID patient2 = UUID.randomUUID();
    AuraUserPrincipal principal = new AuraUserPrincipal(patient1, "u1@aura.ai", "p", true, List.of("USER"));
    UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());

    StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
    accessor.setDestination("/topic/patient/" + patient2);
    accessor.setUser(auth);

    Message<byte[]> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

    assertThatThrownBy(() -> interceptor.preSend(message, messageChannel))
        .isInstanceOf(AccessDeniedException.class)
        .hasMessageContaining("Unauthorized subscription to patient channel");
  }

  @Test
  @DisplayName("SUBSCRIBE: Patient subscribing to own channel /topic/patient/{id} is allowed")
  void subscribe_patientTopic_ownChannel_allowed() {
    UUID patientId = UUID.randomUUID();
    AuraUserPrincipal principal = new AuraUserPrincipal(patientId, "u@aura.ai", "p", true, List.of("USER"));
    UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());

    StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
    accessor.setDestination("/topic/patient/" + patientId);
    accessor.setUser(auth);

    Message<byte[]> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
    Message<?> result = interceptor.preSend(message, messageChannel);

    assertThat(result).isNotNull();
  }

  @Test
  @DisplayName("SUBSCRIBE: Clinic subscribing to /topic/clinic/{id} with matching clinic role is allowed")
  void subscribe_clinicTopic_clinicRole_allowed() {
    UUID clinicId = UUID.randomUUID();
    AuraUserPrincipal principal = new AuraUserPrincipal(clinicId, "c@aura.ai", "p", true, List.of("CLINIC"));
    UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());

    StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
    accessor.setDestination("/topic/clinic/" + clinicId);
    accessor.setUser(auth);

    Message<byte[]> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
    Message<?> result = interceptor.preSend(message, messageChannel);

    assertThat(result).isNotNull();
  }
}
