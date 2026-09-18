package com.aura.event;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.io.Serializable;
import java.util.UUID;

/**
 * Base abstract class for cross-portal events in AURA Retinal Screening System.
 * Connects Patient Portal, Doctor Portal, Clinic Portal, and Admin Portal.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public abstract class CrossPortalEvent implements Serializable {

  private static final long serialVersionUID = 1L;

  private String eventId;
  private String eventType;
  private long timestamp;
  private String portalSource;
  private String targetRole;
  private Object payload;

  protected CrossPortalEvent() {
    this.eventId = UUID.randomUUID().toString();
    this.timestamp = System.currentTimeMillis();
  }

  protected CrossPortalEvent(String eventType, String portalSource, String targetRole) {
    this();
    this.eventType = eventType;
    this.portalSource = portalSource;
    this.targetRole = targetRole;
  }

  protected CrossPortalEvent(String eventId, String eventType, long timestamp, String portalSource, String targetRole, Object payload) {
    this.eventId = eventId != null ? eventId : UUID.randomUUID().toString();
    this.eventType = eventType;
    this.timestamp = timestamp > 0 ? timestamp : System.currentTimeMillis();
    this.portalSource = portalSource;
    this.targetRole = targetRole;
    this.payload = payload;
  }

  public String getEventId() {
    return eventId;
  }

  public void setEventId(String eventId) {
    this.eventId = eventId;
  }

  public String getEventType() {
    return eventType;
  }

  public void setEventType(String eventType) {
    this.eventType = eventType;
  }

  public long getTimestamp() {
    return timestamp;
  }

  public void setTimestamp(long timestamp) {
    this.timestamp = timestamp;
  }

  public String getPortalSource() {
    return portalSource;
  }

  public void setPortalSource(String portalSource) {
    this.portalSource = portalSource;
  }

  public String getTargetRole() {
    return targetRole;
  }

  public void setTargetRole(String targetRole) {
    this.targetRole = targetRole;
  }

  public Object getPayload() {
    return payload != null ? payload : this;
  }

  public void setPayload(Object payload) {
    this.payload = payload;
  }

  @Override
  public String toString() {
    return "CrossPortalEvent{" +
        "eventId='" + eventId + '\'' +
        ", eventType='" + eventType + '\'' +
        ", timestamp=" + timestamp +
        ", portalSource='" + portalSource + '\'' +
        ", targetRole='" + targetRole + '\'' +
        '}';
  }
}
