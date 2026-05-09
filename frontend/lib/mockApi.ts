export const mockApi = {
  login: async (data: any) => {
    console.log("[mock] login call", data);
    return { success: true, user: { email: data.email, role: "student" } };
  },
  register: async (data: any) => {
    console.log("[mock] register call", data);
    return { success: true };
  },
  resetPassword: async (email: string) => {
    console.log("[mock] reset password call", email);
    return { success: true };
  },
};