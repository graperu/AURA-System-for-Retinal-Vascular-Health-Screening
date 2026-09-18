package com.aura.realtime;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.UUID;

/**
 * Standardized AURA Real-time STOMP message envelope conforming to the R6 specification.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RealtimeEventEnvelope<T> {

  private String eventId;
  private String eventType;
  private long timestamp;
  private String producer;
  private String correlationId;
  private T data;

  public RealtimeEventEnvelope() {
    this.eventId = "EVT-" + UUID.randomUUID();
    this.timestamp = Instant.now().toEpochMilli();
    this.producer = "aura-backend";
  }

  public RealtimeEventEnvelope(String eventType, T data) {
    this();
    this.eventType = eventType;
    this.data = data;
  }

  public RealtimeEventEnvelope(String eventType, String correlationId, T data) {
    this(eventType, data);
    this.correlationId = correlationId;
  }

  public static <T> RealtimeEventEnvelope<T> of(String eventType, T data) {
    return new RealtimeEventEnvelope<>(eventType, data);
  }

  public static <T> RealtimeEventEnvelope<T> of(String eventType, String correlationId, T data) {
    return new RealtimeEventEnvelope<>(eventType, correlationId, data);
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

  public String getProducer() {
    return producer;
  }

  public void setProducer(String producer) {
    this.producer = producer;
  }

  public String getCorrelationId() {
    return correlationId;
  }

  public void setCorrelationId(String correlationId) {
    this.correlationId = correlationId;
  }

  public T getData() {
    return data;
  }

  public void setData(T data) {
    this.data = data;
  }
}
