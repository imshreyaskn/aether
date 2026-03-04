package com.example.aether.util;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public class SecurityUtils {

    public static String getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return "anonymousUser";
        }
        return authentication.getName(); // Returns the UID string from FirebaseAuthFilter or "anonymousUser"
    }

}
