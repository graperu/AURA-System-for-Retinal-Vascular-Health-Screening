package com.aura.patient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.mock.web.MockMultipartFile;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Testcontainers
class PatientProfileIntegrationTest {

  private static final String ORIGIN = "https://aura.example.test";

  @Container
  static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine");

  @DynamicPropertySource
  static void properties(DynamicPropertyRegistry registry) {
    registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
    registry.add("spring.datasource.username", POSTGRES::getUsername);
    registry.add("spring.datasource.password", POSTGRES::getPassword);
    registry.add("aura.cors.allowed-origins", () -> ORIGIN);
  }

  @Autowired MockMvc mvc;
  @Autowired ObjectMapper mapper;

  private String token;

  @BeforeEach
  void setUp() throws Exception {
    String email = "patient_profile_" + System.nanoTime() + "@aura.test";
    String registerBody = """
        {
          "email": "%s",
          "password": "Password123!",
          "fullName": "Le Van Test"
        }
        """.formatted(email);

    mvc.perform(
            org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/v1/auth/register")
                .header(HttpHeaders.ORIGIN, ORIGIN)
                .contentType(MediaType.APPLICATION_JSON)
                .content(registerBody))
        .andExpect(status().isCreated());

    String loginBody = """
        {
          "email": "%s",
          "password": "Password123!"
        }
        """.formatted(email);

    String loginResp = mvc.perform(
            org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/v1/auth/login")
                .header(HttpHeaders.ORIGIN, ORIGIN)
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginBody))
        .andExpect(status().isOk())
        .andReturn()
        .getResponse()
        .getContentAsString();

    JsonNode node = mapper.readTree(loginResp);
    token = node.at("/data/accessToken").asText();
  }

  @Test
  void getProfile_whenAuthenticated_returnsProfileWithNullVitalsInitially() throws Exception {
    mvc.perform(
            get("/api/v1/patient/profile")
                .header(HttpHeaders.ORIGIN, ORIGIN)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.fullName").value("Le Van Test"))
        .andExpect(jsonPath("$.data.mrn").exists())
        .andExpect(jsonPath("$.data.systolicBp").value(org.hamcrest.Matchers.nullValue()))
        .andExpect(jsonPath("$.data.diastolicBp").value(org.hamcrest.Matchers.nullValue()))
        .andExpect(jsonPath("$.data.hba1c").value(org.hamcrest.Matchers.nullValue()))
        .andExpect(jsonPath("$.data.bloodType").value(org.hamcrest.Matchers.nullValue()))
        .andExpect(jsonPath("$.data.assignedDoctor").value(org.hamcrest.Matchers.nullValue()))
        .andExpect(jsonPath("$.data.hasDiabetes").value(org.hamcrest.Matchers.nullValue()))
        .andExpect(jsonPath("$.data.hasHypertension").value(org.hamcrest.Matchers.nullValue()))
        .andExpect(jsonPath("$.data.historyOfSmoking").value(org.hamcrest.Matchers.nullValue()));
  }

  @Test
  void updateProfile_withTriStateAndNullBloodType_persistsCorrectly() throws Exception {
    String updatePayload = """
        {
          "fullName": "Le Van TriState",
          "bloodType": null,
          "hasDiabetes": false,
          "hasHypertension": null,
          "historyOfSmoking": true,
          "historyOfHeartDisease": false,
          "historyOfStroke": null
        }
        """;

    mvc.perform(
            put("/api/v1/patient/profile")
                .header(HttpHeaders.ORIGIN, ORIGIN)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(updatePayload))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.fullName").value("Le Van TriState"))
        .andExpect(jsonPath("$.data.bloodType").value(org.hamcrest.Matchers.nullValue()))
        .andExpect(jsonPath("$.data.hasDiabetes").value(false))
        .andExpect(jsonPath("$.data.hasHypertension").value(org.hamcrest.Matchers.nullValue()))
        .andExpect(jsonPath("$.data.historyOfSmoking").value(true))
        .andExpect(jsonPath("$.data.historyOfHeartDisease").value(false))
        .andExpect(jsonPath("$.data.historyOfStroke").value(org.hamcrest.Matchers.nullValue()));

    // Verify GET immediately returns the exact tri-state values
    mvc.perform(
            get("/api/v1/patient/profile")
                .header(HttpHeaders.ORIGIN, ORIGIN)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.bloodType").value(org.hamcrest.Matchers.nullValue()))
        .andExpect(jsonPath("$.data.hasDiabetes").value(false))
        .andExpect(jsonPath("$.data.hasHypertension").value(org.hamcrest.Matchers.nullValue()))
        .andExpect(jsonPath("$.data.historyOfSmoking").value(true))
        .andExpect(jsonPath("$.data.historyOfHeartDisease").value(false))
        .andExpect(jsonPath("$.data.historyOfStroke").value(org.hamcrest.Matchers.nullValue()));
  }

  @Test
  void updateProfile_andGetProfile_persistsAndCalculatesAgeCorrectly() throws Exception {
    LocalDate dob = LocalDate.of(1995, 8, 20);
    String updatePayload = """
        {
          "fullName": "Le Van Updated",
          "dateOfBirth": "%s",
          "gender": "Male",
          "phoneNumber": "0912345678",
          "address": "456 Le Duan, Da Nang",
          "bloodType": "A+",
          "systolicBp": 128,
          "diastolicBp": 82,
          "hba1c": 5.8,
          "hasDiabetes": true,
          "diabetesType": "Type2",
          "diabetesDurationYears": 2,
          "hasHypertension": true,
          "historyOfSmoking": false,
          "historyOfHeartDisease": false,
          "historyOfStroke": true,
          "currentMedications": "Metformin 500mg",
          "allergies": "Aspirin",
          "emergencyContactName": "Le Thi C",
          "emergencyContactPhone": "0987654321"
        }
        """.formatted(dob);

    mvc.perform(
            put("/api/v1/patient/profile")
                .header(HttpHeaders.ORIGIN, ORIGIN)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(updatePayload))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.fullName").value("Le Van Updated"))
        .andExpect(jsonPath("$.data.bloodType").value("A+"))
        .andExpect(jsonPath("$.data.systolicBp").value(128))
        .andExpect(jsonPath("$.data.diastolicBp").value(82))
        .andExpect(jsonPath("$.data.hba1c").value(5.8))
        .andExpect(jsonPath("$.data.hasDiabetes").value(true))
        .andExpect(jsonPath("$.data.historyOfStroke").value(true))
        .andExpect(jsonPath("$.data.allergies").value("Aspirin"));

    // Verify GET immediately returns the exact persisted data
    mvc.perform(
            get("/api/v1/patient/profile")
                .header(HttpHeaders.ORIGIN, ORIGIN)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.fullName").value("Le Van Updated"))
        .andExpect(jsonPath("$.data.systolicBp").value(128))
        .andExpect(jsonPath("$.data.diastolicBp").value(82))
        .andExpect(jsonPath("$.data.hba1c").value(5.8))
        .andExpect(jsonPath("$.data.historyOfStroke").value(true));
  }

  @Test
  void updateProfile_whenSystolicEqualsDiastolic_rejectsWith400() throws Exception {
    String invalidBpPayload = """
        {
          "fullName": "Le Van Test",
          "systolicBp": 96,
          "diastolicBp": 96
        }
        """;

    mvc.perform(
            put("/api/v1/patient/profile")
                .header(HttpHeaders.ORIGIN, ORIGIN)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidBpPayload))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.success").value(false))
        .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Huyết áp tâm thu phải lớn hơn huyết áp tâm trương")));
  }

  @Test
  void getProfile_whenUnauthenticated_returns401() throws Exception {
    mvc.perform(
            get("/api/v1/patient/profile")
                .header(HttpHeaders.ORIGIN, ORIGIN))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void labDocument_uploadListDownloadAndDelete_roundTripsBinaryFile() throws Exception {
    String profileResponse = mvc.perform(get("/api/v1/patient/profile")
            .header(HttpHeaders.ORIGIN, ORIGIN)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
        .andReturn().getResponse().getContentAsString();
    String patientId = mapper.readTree(profileResponse).at("/data/userId").asText();
    MockMultipartFile file = new MockMultipartFile(
        "file", "ket-qua.pdf", "application/pdf", "%PDF-test".getBytes());

    String uploadResponse = mvc.perform(multipart("/api/v1/patient/profile/lab-documents")
            .file(file)
            .header(HttpHeaders.ORIGIN, ORIGIN)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.fileName").value("ket-qua.pdf"))
        .andReturn().getResponse().getContentAsString();
    String documentId = mapper.readTree(uploadResponse).at("/data/id").asText();

    mvc.perform(get("/api/v1/patient/profile/lab-documents")
            .header(HttpHeaders.ORIGIN, ORIGIN)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data[0].id").value(documentId));

    mvc.perform(get("/api/v1/patient/profile/" + patientId + "/lab-documents/" + documentId + "/content")
            .header(HttpHeaders.ORIGIN, ORIGIN)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(result -> assertThat(result.getResponse().getContentAsByteArray()).isEqualTo("%PDF-test".getBytes()));

    mvc.perform(delete("/api/v1/patient/profile/lab-documents/" + documentId)
            .header(HttpHeaders.ORIGIN, ORIGIN)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
        .andExpect(status().isOk());
  }
}
