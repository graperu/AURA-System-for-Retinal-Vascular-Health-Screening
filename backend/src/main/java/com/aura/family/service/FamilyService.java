package com.aura.family.service;

import com.aura.common.exception.ResourceNotFoundException;
import com.aura.family.dto.CreateFamilyMemberRequest;
import com.aura.family.dto.FamilyMemberResponse;
import com.aura.family.entity.FamilyMember;
import com.aura.family.repository.FamilyMemberRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FamilyService {

  private final FamilyMemberRepository repository;

  public FamilyService(FamilyMemberRepository repository) {
    this.repository = repository;
  }

  public List<FamilyMemberResponse> list(UUID ownerId) {
    return repository.findByOwnerUserIdOrderByCreatedAtAsc(ownerId).stream().map(this::toDto).toList();
  }

  @Transactional
  public FamilyMemberResponse create(UUID ownerId, CreateFamilyMemberRequest req) {
    if (req.displayName() == null || req.displayName().isBlank()) {
      throw new IllegalArgumentException("Tên thành viên không được trống");
    }
    FamilyMember member =
        new FamilyMember(
            ownerId,
            req.displayName().trim(),
            req.relationship() == null || req.relationship().isBlank() ? "OTHER" : req.relationship(),
            req.dateOfBirth(),
            req.gender());
    if (repository.findByOwnerUserIdOrderByCreatedAtAsc(ownerId).isEmpty()) {
      member.setActive(true);
    }
    return toDto(repository.save(member));
  }

  @Transactional
  public FamilyMemberResponse activate(UUID ownerId, UUID memberId) {
    List<FamilyMember> all = repository.findByOwnerUserIdOrderByCreatedAtAsc(ownerId);
    FamilyMember target =
        all.stream()
            .filter(m -> m.getId().equals(memberId))
            .findFirst()
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ gia đình"));
    all.forEach(m -> m.setActive(false));
    target.setActive(true);
    repository.saveAll(all);
    return toDto(target);
  }

  @Transactional
  public void delete(UUID ownerId, UUID memberId) {
    FamilyMember member =
        repository
            .findById(memberId)
            .filter(m -> m.getOwnerUserId().equals(ownerId))
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ gia đình"));
    repository.delete(member);
  }

  private FamilyMemberResponse toDto(FamilyMember m) {
    return new FamilyMemberResponse(
        m.getId(), m.getDisplayName(), m.getRelationship(), m.getDateOfBirth(), m.getGender(), m.isActive());
  }
}
