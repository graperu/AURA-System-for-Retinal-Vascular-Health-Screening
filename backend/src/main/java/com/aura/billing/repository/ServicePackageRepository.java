package com.aura.billing.repository;

import com.aura.billing.entity.PackageScope;
import com.aura.billing.entity.ServicePackage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServicePackageRepository extends JpaRepository<ServicePackage, Long> {

    List<ServicePackage> findByActiveTrueAndScope(PackageScope scope);
}