package com.aura.auth.dto; public record LoginResponse(String accessToken,String tokenType,long expiresIn,UserResponse user){}
