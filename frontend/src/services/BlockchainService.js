// AgroMind Blockchain Simulation Service
// Manages Green Token rewards for sustainable farming activities

const TOKEN_KEY = "agro_green_tokens";
const INITIAL_TOKENS = 2450;

export const BlockchainService = {
  getTokens: () => {
    const tokens = localStorage.getItem(TOKEN_KEY);
    return tokens ? parseInt(tokens) : INITIAL_TOKENS;
  },

  addTokens: (amount, activity) => {
    const current = BlockchainService.getTokens();
    const updated = current + amount;
    localStorage.setItem(TOKEN_KEY, updated.toString());
    
    // Log transaction
    const history = JSON.parse(localStorage.getItem("agro_token_history") || "[]");
    history.unshift({
      date: new Date().toISOString(),
      amount,
      activity,
      status: "Verified"
    });
    localStorage.setItem("agro_token_history", JSON.stringify(history.slice(0, 20)));
    
    return updated;
  },

  getHistory: () => {
    return JSON.parse(localStorage.getItem("agro_token_history") || "[]");
  },
  
  getSustainabilityLevel: () => {
    const tokens = BlockchainService.getTokens();
    if (tokens > 5000) return "Platinum";
    if (tokens > 2000) return "Gold";
    if (tokens > 500) return "Silver";
    return "Bronze";
  }
};
