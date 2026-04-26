export async function saveToWaitlist(email: string, category: string) {
  try {
    // Calling the Python API Bridge to bypass Directus CORS restrictions.
    const response = await fetch("https://api.neevios.com/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), category }),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.detail || "Submission failed. Please try again." };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Bridge Exception:", error);
    return { success: false, error: "System busy. Please try again in a few minutes." };
  }
}



