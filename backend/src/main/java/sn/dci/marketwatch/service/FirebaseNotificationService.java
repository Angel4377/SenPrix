package sn.dci.marketwatch.service;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Service Firebase Cloud Messaging (FCM) pour l'envoi de push notifications.
 * Activé uniquement si app.firebase.enabled=true et un token FCM est disponible.
 */
@Slf4j
@Service
public class FirebaseNotificationService {

    @Value("${app.firebase.enabled:false}")
    private boolean firebaseEnabled;

    /**
     * Envoie une notification push à un token FCM spécifique.
     *
     * @param fcmToken  Token FCM du destinataire
     * @param title     Titre de la notification
     * @param body      Corps du message
     * @param priority  Priorité (CRITICAL, HIGH, etc.)
     */
    public void sendPushNotification(String fcmToken, String title, String body, String priority) {
        if (!firebaseEnabled) {
            log.debug("[Firebase DISABLED] Notification ignorée : {} — {}", title, body);
            return;
        }
        if (fcmToken == null || fcmToken.isBlank()) {
            log.warn("[Firebase] Token FCM vide, notification annulée");
            return;
        }
        try {
            Message message = Message.builder()
                    .setToken(fcmToken)
                    .setNotification(Notification.builder()
                            .setTitle(title)
                            .setBody(body)
                            .build())
                    .putData("priority", priority)
                    .putData("type", "PRICE_ALERT")
                    .build();

            String response = FirebaseMessaging.getInstance().send(message);
            log.info("[Firebase] Notification envoyée : {} → {}", fcmToken.substring(0, 10) + "...", response);
        } catch (Exception e) {
            log.error("[Firebase] Échec envoi notification : {}", e.getMessage());
        }
    }

    /**
     * Envoie une notification à un topic (groupe d'utilisateurs abonnés).
     * Ex: topic "agents-dakar" → tous les agents de Dakar reçoivent la notif.
     *
     * @param topic     Nom du topic FCM (ex: "agents", "admins", "agents-dakar")
     * @param title     Titre
     * @param body      Message
     * @param priority  Priorité de l'alerte
     */
    public void sendToTopic(String topic, String title, String body, String priority) {
        if (!firebaseEnabled) {
            log.debug("[Firebase DISABLED] Topic '{}' ignoré : {}", topic, title);
            return;
        }
        try {
            Message message = Message.builder()
                    .setTopic(topic)
                    .setNotification(Notification.builder()
                            .setTitle(title)
                            .setBody(body)
                            .build())
                    .putData("priority", priority)
                    .putData("type", "PRICE_ALERT")
                    .build();

            String response = FirebaseMessaging.getInstance().send(message);
            log.info("[Firebase] Topic '{}' notifié : {}", topic, response);
        } catch (Exception e) {
            log.error("[Firebase] Échec envoi topic '{}' : {}", topic, e.getMessage());
        }
    }
}
