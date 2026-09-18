package com.aura.audit.annotation;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * HIPAA NFR-18 Compliant Audit Trail Annotation.
 * Automatically records user identification, IP address, user-agent,
 * target resource, clinical/security action, and execution outcome in audit_logs.
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface Audited {

  /**
   * Action code, e.g. "AUTH_LOGIN", "PHI_READ", "CLINICAL_REVIEW", "ADMIN_USER_UPDATE".
   */
  String action() default "";

  /**
   * Domain module, e.g. "AUTH", "PATIENT", "SCREENING", "ADMIN", "DOCTOR".
   */
  String module() default "";

  /**
   * Resource type, e.g. "USER", "PATIENT_PROFILE", "SCREENING", "AI_CONFIG".
   */
  String resourceType() default "";

  /**
   * Human-readable description of the audited event.
   */
  String description() default "";
}
