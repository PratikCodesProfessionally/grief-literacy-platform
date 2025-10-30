export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  console.log(`Verification email would be sent to ${email} with token ${token}`);
  // Placeholder - implement actual email service
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  console.log(`Password reset email would be sent to ${email} with token ${token}`);
  // Placeholder - implement actual email service
}
