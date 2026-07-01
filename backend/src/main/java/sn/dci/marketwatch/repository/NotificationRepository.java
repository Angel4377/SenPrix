package sn.dci.marketwatch.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import sn.dci.marketwatch.entity.Notification;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUser_IdOrderByCreatedAtDesc(Long userId);
    long countByUser_IdAndIsReadFalse(Long userId);
}
