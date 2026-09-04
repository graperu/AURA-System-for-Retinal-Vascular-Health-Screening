package com.aura.admin.dto;

import java.util.List;

public record AssignmentBoardResponse(
    List<AssignmentDoctorDto> doctors,
    List<AssignmentPatientDto> patients) {}
