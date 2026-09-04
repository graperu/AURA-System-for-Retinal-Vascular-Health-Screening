package com.aura.auth.exception;

import com.aura.common.response.ErrorCode;

public class AuthException extends RuntimeException {
  private final ErrorCode code;

  public AuthException(ErrorCode c, String m) {
    super(m);
    code = c;
  }

  public ErrorCode code() {
    return code;
  }
}
