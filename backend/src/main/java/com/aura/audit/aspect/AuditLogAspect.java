package com.aura.audit.aspect;

import com.aura.audit.annotation.Audited;
import com.aura.audit.service.AuditLogService;
import com.aura.auth.security.AuraUserPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import java.lang.reflect.Method;
import java.lang.reflect.Parameter;
import java.util.UUID;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * HIPAA NFR-18 Compliant Spring AOP Aspect for Auditing Clinical & Security Events.
 * Captures user identity, IP address, user agent, target resource, action, and execution outcome.
 */
@Aspect
@Component
public class AuditLogAspect {

  private static final Logger log = LoggerFactory.getLogger(AuditLogAspect.class);
  private final AuditLogService auditLogService;

  public AuditLogAspect(AuditLogService auditLogService) {
    this.auditLogService = auditLogService;
  }

  @Around("@annotation(audited)")
  public Object logAuditedMethod(ProceedingJoinPoint joinPoint, Audited audited) throws Throwable {
    long startTime = System.currentTimeMillis();

    // 1. Initial user & client info from SecurityContext and RequestContext
    UUID userId = null;
    String userEmail = null;
    String userRole = null;

    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth != null && auth.getPrincipal() instanceof AuraUserPrincipal p) {
      userId = p.id();
      userEmail = p.email();
      userRole = p.roles() != null ? String.join(",", p.roles()) : null;
    } else if (auth != null && auth.getName() != null && !"anonymousUser".equals(auth.getName())) {
      userEmail = auth.getName();
    }

    // Inspect request for IP and User-Agent
    String ipAddress = "127.0.0.1";
    String userAgent = "Unknown";
    ServletRequestAttributes attrs =
        (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
    if (attrs != null) {
      HttpServletRequest req = attrs.getRequest();
      ipAddress = extractIpAddress(req);
      userAgent = req.getHeader("User-Agent");
      if (userAgent != null && userAgent.length() > 255) {
        userAgent = userAgent.substring(0, 255);
      }
    }

    // 2. Resource ID & fallback email from method arguments
    String resourceId = extractResourceId(joinPoint);
    if (userEmail == null || userEmail.isBlank()) {
      userEmail = extractEmailFromArgs(joinPoint.getArgs());
    }

    // 3. Execution
    Object result;
    try {
      result = joinPoint.proceed();

      // If user info was absent before invocation (e.g. login endpoint), extract from result
      if (userId == null || userEmail == null) {
        UserInfo extracted = extractUserFromResult(result);
        if (extracted != null) {
          if (userId == null) userId = extracted.id();
          if (userEmail == null) userEmail = extracted.email();
          if (userRole == null) userRole = extracted.role();
        }
      }

      String action = audited.action().isBlank() ? joinPoint.getSignature().getName().toUpperCase() : audited.action();
      String module = audited.module().isBlank() ? "SYSTEM" : audited.module();
      String resourceType = audited.resourceType().isBlank() ? "RESOURCE" : audited.resourceType();
      String details = buildDetails(audited.description(), System.currentTimeMillis() - startTime, null);

      safeRecordLog(userId, userEmail, userRole, module, action, resourceType, resourceId, ipAddress, userAgent, "SUCCESS", details);
      return result;
    } catch (Throwable t) {
      String action = audited.action().isBlank() ? joinPoint.getSignature().getName().toUpperCase() : audited.action();
      String failAction = action.endsWith("_FAILED") ? action : action + "_FAILED";
      String module = audited.module().isBlank() ? "SYSTEM" : audited.module();
      String resourceType = audited.resourceType().isBlank() ? "RESOURCE" : audited.resourceType();
      String details = buildDetails(audited.description(), System.currentTimeMillis() - startTime, t.getMessage());

      safeRecordLog(userId, userEmail, userRole, module, failAction, resourceType, resourceId, ipAddress, userAgent, "FAILURE", details);
      throw t;
    }
  }

  private void safeRecordLog(
      UUID userId,
      String userEmail,
      String userRole,
      String module,
      String action,
      String resourceType,
      String resourceId,
      String ipAddress,
      String userAgent,
      String status,
      String details) {
    try {
      auditLogService.logEvent(
          userId,
          userEmail,
          userRole,
          module,
          action,
          resourceType,
          resourceId,
          ipAddress,
          userAgent,
          status,
          details);
    } catch (Exception e) {
      log.warn("Unable to persist HIPAA audit trail event [{}]: {}", action, e.getMessage());
    }
  }

  private String extractResourceId(ProceedingJoinPoint joinPoint) {
    MethodSignature sig = (MethodSignature) joinPoint.getSignature();
    Method method = sig.getMethod();
    Parameter[] parameters = method.getParameters();
    Object[] args = joinPoint.getArgs();

    for (int i = 0; i < parameters.length; i++) {
      String name = parameters[i].getName().toLowerCase();
      Object arg = args[i];
      if (arg == null) continue;

      if (name.contains("id") || name.equals("mrn")) {
        return String.valueOf(arg);
      }
      if (arg instanceof UUID) {
        return arg.toString();
      }
    }
    return null;
  }

  private String extractEmailFromArgs(Object[] args) {
    if (args == null) return null;
    for (Object arg : args) {
      if (arg == null) continue;
      try {
        Method getEmail = arg.getClass().getMethod("email");
        Object val = getEmail.invoke(arg);
        if (val instanceof String s && !s.isBlank()) return s;
      } catch (Exception ignored) {
      }
      try {
        Method getEmail = arg.getClass().getMethod("getEmail");
        Object val = getEmail.invoke(arg);
        if (val instanceof String s && !s.isBlank()) return s;
      } catch (Exception ignored) {
      }
    }
    return null;
  }

  private record UserInfo(UUID id, String email, String role) {}

  private UserInfo extractUserFromResult(Object result) {
    if (result == null) return null;
    Object body = result;
    if (result instanceof ResponseEntity<?> re) {
      body = re.getBody();
    }
    if (body == null) return null;

    try {
      Method getData = body.getClass().getMethod("getData");
      Object data = getData.invoke(body);
      if (data == null) {
        try {
          Method dataMethod = body.getClass().getMethod("data");
          data = dataMethod.invoke(body);
        } catch (Exception ignored) {
        }
      }
      if (data != null) {
        // Check if data is LoginResponse or has user()
        try {
          Method userMethod = data.getClass().getMethod("user");
          Object userObj = userMethod.invoke(data);
          if (userObj != null) {
            UUID uId = null;
            String uEmail = null;
            String uRole = null;
            try {
              uId = (UUID) userObj.getClass().getMethod("id").invoke(userObj);
            } catch (Exception ignored) {}
            try {
              uEmail = (String) userObj.getClass().getMethod("email").invoke(userObj);
            } catch (Exception ignored) {}
            try {
              uRole = String.valueOf(userObj.getClass().getMethod("role").invoke(userObj));
            } catch (Exception ignored) {}
            return new UserInfo(uId, uEmail, uRole);
          }
        } catch (Exception ignored) {
        }
      }
    } catch (Exception ignored) {
    }
    return null;
  }

  private String extractIpAddress(HttpServletRequest req) {
    if (req == null) return "127.0.0.1";
    String xForwarded = req.getHeader("X-Forwarded-For");
    if (xForwarded != null && !xForwarded.isBlank()) {
      String ip = xForwarded.split(",")[0].trim();
      return ip.length() > 45 ? ip.substring(0, 45) : ip;
    }
    String xReal = req.getHeader("X-Real-IP");
    if (xReal != null && !xReal.isBlank()) {
      return xReal.trim().length() > 45 ? xReal.trim().substring(0, 45) : xReal.trim();
    }
    String remoteAddr = req.getRemoteAddr();
    return remoteAddr != null && remoteAddr.length() > 45 ? remoteAddr.substring(0, 45) : remoteAddr;
  }

  private String buildDetails(String description, long elapsedMs, String errorMsg) {
    StringBuilder sb = new StringBuilder();
    if (description != null && !description.isBlank()) {
      sb.append(description).append(". ");
    }
    sb.append("Duration: ").append(elapsedMs).append("ms");
    if (errorMsg != null) {
      sb.append(". Error: ").append(errorMsg);
    }
    return sb.toString();
  }
}
