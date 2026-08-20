package sn.dci.marketwatch.repository;

import org.springframework.data.jpa.repository.*;
import sn.dci.marketwatch.entity.Signalement;
import java.util.List;

public interface SignalementRepository extends JpaRepository<Signalement, Long> {
    List<Signalement> findByConsumer_IdOrderByCreatedAtDesc(Long consumerId);
    List<Signalement> findByMerchant_IdOrderByCreatedAtDesc(Long merchantId);
    List<Signalement> findAllByOrderByCreatedAtDesc();
    long countByStatus(Signalement.Statut status);
    long countByPriority(Signalement.Priorite priority);

    @Query("SELECT r FROM Signalement r LEFT JOIN FETCH r.product LEFT JOIN FETCH r.region ORDER BY r.createdAt DESC NULLS LAST")
    List<Signalement> findAllWithDetailsOrderByDate();

    @Query("SELECT r FROM Signalement r LEFT JOIN FETCH r.product LEFT JOIN FETCH r.region WHERE r.status <> 'RESOLVED' AND r.status <> 'REJECTED' ORDER BY r.createdAt DESC NULLS LAST")
    List<Signalement> findActiveOrderedByPriority();

    @Query("SELECT r.region.name, COUNT(r) FROM Signalement r WHERE r.region IS NOT NULL GROUP BY r.region.name ORDER BY COUNT(r) DESC")
    List<Object[]> countByRegion();

    @Query("SELECT r.priority, COUNT(r) FROM Signalement r WHERE r.priority IS NOT NULL GROUP BY r.priority")
    List<Object[]> countByPriorityGrouped();
}