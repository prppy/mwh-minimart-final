export interface User {
  id: number; // from u."User_ID"
  userName: string; // from u."User_Name"
  userRole: string; // from u."User_Role" — consider string union if possible
  profilePicture?: string | null; // from u."Profile_Picture"
  passwordHash: string; // from u."Password_Hash"
  biometricHash?: string | null; // from u."Biometric_Hash"
  createdAt: string; // from u."Created_At" (ISO string date)
  updatedAt: string; // from u."Updated_At"

  // Resident specific fields, optional because user may not be resident
  resident_dateOfBirth?: string | null; // from r."Date_Of_Birth"
  resident_dateOfAdmission?: string | null; // from r."Date_Of_Admission"
  resident_lastAbscondence?: string | null; // from r."Last_Abscondence"
}
