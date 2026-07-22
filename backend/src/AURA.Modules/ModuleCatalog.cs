namespace AURA.Modules;

public static class ModuleCatalog
{
    public static readonly IReadOnlyList<string> PlannedModules =
    [
        "Identity", "Clinics", "Doctors", "Patients", "Examinations",
        "RetinalImages", "Analyses", "Reviews", "Reports", "Payments",
        "Chat", "Notifications", "Administration", "Audit", "AIModels"
    ];
}

public enum SystemRole
{
    User,
    Doctor,
    Clinic,
    Admin
}
