package com.example.aether.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Base64;

@Configuration
public class FirebaseConfig {

    @Value("${firebase.enabled:false}")
    private boolean firebaseEnabled;

    /**
     * In production (Railway), set FIREBASE_SA_BASE64 env var to the
     * base64-encoded contents of firebase-service-account.json.
     * Locally, leave it empty — the file on disk is used instead.
     */
    @Value("${FIREBASE_SA_BASE64:}")
    private String firebaseSaBase64;

    @PostConstruct
    public void init() {
        if (!firebaseEnabled) {
            System.out.println("[AETHER] Firebase auth DISABLED — running in bypass mode");
            return;
        }

        try {
            if (FirebaseApp.getApps().isEmpty()) {
                InputStream serviceAccount;

                if (firebaseSaBase64 != null && !firebaseSaBase64.isBlank()) {
                    // Production: read from base64 env var
                    byte[] decoded = Base64.getDecoder().decode(firebaseSaBase64);
                    serviceAccount = new ByteArrayInputStream(decoded);
                    System.out.println("[AETHER] Firebase: using FIREBASE_SA_BASE64 env var");
                } else {
                    // Local dev: read from classpath file
                    serviceAccount = new ClassPathResource("firebase-service-account.json").getInputStream();
                    System.out.println("[AETHER] Firebase: using classpath file");
                }

                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                        .build();
                FirebaseApp.initializeApp(options);
                System.out.println("[AETHER] Firebase Admin SDK initialized ✓");
            }
        } catch (IOException e) {
            System.err.println("[AETHER] Failed to initialize Firebase: " + e.getMessage());
            throw new RuntimeException("Firebase initialization failed", e);
        }
    }
}
